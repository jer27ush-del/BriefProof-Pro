-- BriefProof: run in a new Supabase project's SQL editor.
begin;
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '', created_at timestamptz not null default now());
create table public.creators(id uuid primary key,slug text unique not null,profile jsonb not null,sort_order integer not null default 0,created_at timestamptz not null default now());
create table public.creator_portfolio_items(id text primary key,creator_id uuid not null references public.creators(id) on delete cascade,metadata jsonb not null,created_at timestamptz not null default now());
create table public.saved_creators(owner_id uuid not null references auth.users(id) on delete cascade,creator_id uuid not null references public.creators(id) on delete cascade,created_at timestamptz not null default now(),primary key(owner_id,creator_id));
create table public.briefs(id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,input jsonb not null,output jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,owner_id));
create table public.campaigns(id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,brief_id uuid not null unique,creator_id uuid references public.creators(id),status text not null default 'Draft' check(status in ('Draft','In Review','In Progress','Completed')),state jsonb not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,owner_id),foreign key(brief_id,owner_id) references public.briefs(id,owner_id) on delete cascade);
create table public.campaign_milestones(id uuid primary key,owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,campaign_id uuid not null,payload jsonb not null,position integer not null default 0,created_at timestamptz not null default now(),foreign key(campaign_id,owner_id) references public.campaigns(id,owner_id) on delete cascade);
create table public.creator_evaluations(id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,campaign_id uuid not null,creator_id uuid not null references public.creators(id),result jsonb not null,created_at timestamptz not null default now(),foreign key(campaign_id,owner_id) references public.campaigns(id,owner_id) on delete cascade);
create table public.ai_usage(owner_id uuid not null references auth.users(id) on delete cascade,bucket text not null,window_start timestamptz not null,count integer not null default 1,primary key(owner_id,bucket,window_start));
create index briefs_owner_idx on public.briefs(owner_id);
create index campaigns_owner_idx on public.campaigns(owner_id);
create index milestones_owner_idx on public.campaign_milestones(owner_id,campaign_id);
create index evaluations_owner_idx on public.creator_evaluations(owner_id,campaign_id);
alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.creator_portfolio_items enable row level security;
alter table public.saved_creators enable row level security;
alter table public.briefs enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_milestones enable row level security;
alter table public.creator_evaluations enable row level security;
alter table public.ai_usage enable row level security;
create policy "Public sample creators" on public.creators for select to anon,authenticated using(true);
create policy "Public sample portfolio" on public.creator_portfolio_items for select to anon,authenticated using(true);
create policy "Own profile" on public.profiles for all to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
create policy "Own bookmarks" on public.saved_creators for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create policy "Own briefs" on public.briefs for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create policy "Own campaigns" on public.campaigns for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create policy "Own milestones" on public.campaign_milestones for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create policy "Own evaluations" on public.creator_evaluations for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
-- ai_usage intentionally has NO client-write policies. Only the fixed limiter RPC writes it.
grant select on public.creators,public.creator_portfolio_items to anon,authenticated;
grant select,insert,update,delete on public.profiles,public.saved_creators,public.briefs,public.campaigns,public.campaign_milestones,public.creator_evaluations to authenticated;
revoke all on public.ai_usage from anon,authenticated;
create function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=clock_timestamp();return new;end $$;
create trigger briefs_updated before update on public.briefs for each row execute function public.set_updated_at();
create trigger campaigns_updated before update on public.campaigns for each row execute function public.set_updated_at();
create function public.on_user_created() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100));return new;end $$;
create trigger briefproof_new_user after insert on auth.users for each row execute function public.on_user_created();
revoke all on function public.on_user_created() from public;
-- Atomic owner-scoped brief + campaign creation. No service-role credentials are used by the app.
create function public.save_brief(p_id uuid,p_input jsonb,p_output jsonb,p_creator uuid,p_state jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare b uuid; c uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated';end if;
 if p_id is null then
 insert into public.briefs(owner_id,input,output) values(auth.uid(),p_input,p_output) returning id into b;
 insert into public.campaigns(owner_id,brief_id,creator_id,state,status) values(auth.uid(),b,p_creator,p_state,case when p_output is null then 'Draft' else 'In Review' end) returning id into c;
 else
 update public.briefs set input=p_input,output=p_output where id=p_id and owner_id=auth.uid() returning id into b;
 if b is null then raise exception 'Not found';end if;
 update public.campaigns set status='In Review',state=jsonb_set(state,'{acceptedAt}','null'::jsonb) where brief_id=b and owner_id=auth.uid() returning id into c;
 end if;
 return c;
end $$;
revoke all on function public.save_brief(uuid,jsonb,jsonb,uuid,jsonb) from public;
grant execute on function public.save_brief(uuid,jsonb,jsonb,uuid,jsonb) to authenticated;
-- Atomic campaign save with optimistic locking and normalized milestone rows.
create function public.save_campaign(p_id uuid,p_version timestamptz,p_status text,p_creator uuid,p_state jsonb,p_milestones jsonb) returns timestamptz language plpgsql security invoker set search_path='' as $$
declare existing public.campaigns; item jsonb; n integer:=0; version timestamptz;
begin
 select * into existing from public.campaigns where id=p_id and owner_id=auth.uid() for update;
 if existing.id is null then raise exception 'Not found';end if;
 if existing.updated_at<>p_version then raise exception 'Version conflict';end if;
 update public.campaigns set status=p_status,creator_id=p_creator,state=p_state where id=p_id and owner_id=auth.uid() returning updated_at into version;
 if p_milestones is not null then
 delete from public.campaign_milestones where campaign_id=p_id and owner_id=auth.uid();
 for item in select value from jsonb_array_elements(p_milestones) loop
 insert into public.campaign_milestones(id,owner_id,campaign_id,payload,position) values((item->>'id')::uuid,auth.uid(),p_id,item,n);n:=n+1;
 end loop;
 end if;
 return version;
end $$;
revoke all on function public.save_campaign(uuid,timestamptz,text,uuid,jsonb,jsonb) from public;
grant execute on function public.save_campaign(uuid,timestamptz,text,uuid,jsonb,jsonb) to authenticated;
-- Shared database rate limit: 10 calls/minute and 100 calls/day per verified account.
create function public.consume_ai_quota() returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); minute_count integer; daily_count integer;
begin
 if uid is null then return false;end if;
 insert into public.ai_usage(owner_id,bucket,window_start,count) values(uid,'day',date_trunc('day',now()),1)
 on conflict(owner_id,bucket,window_start) do update set count=public.ai_usage.count+1 returning count into daily_count;
 insert into public.ai_usage(owner_id,bucket,window_start,count) values(uid,'minute',date_trunc('minute',now()),1)
 on conflict(owner_id,bucket,window_start) do update set count=public.ai_usage.count+1 returning count into minute_count;
 return daily_count<=100 and minute_count<=10;
end $$;
revoke all on function public.consume_ai_quota() from public;
grant execute on function public.consume_ai_quota() to authenticated;
-- Private image storage. Paths begin with the authenticated user's UUID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('campaign-assets','campaign-assets',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Read own campaign assets" on storage.objects for select to authenticated using(bucket_id='campaign-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Upload own campaign assets" on storage.objects for insert to authenticated with check(bucket_id='campaign-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Delete own campaign assets" on storage.objects for delete to authenticated using(bucket_id='campaign-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
