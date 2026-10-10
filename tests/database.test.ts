import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL migration, ownership policies, transactions and storage isolation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public,storage to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
 `);
    const sql = await readFile(
      "supabase/migrations/001_briefproof.sql",
      "utf8",
    );
    await db.exec(sql.replace("create extension if not exists pgcrypto;", ""));
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    const a = "10000000-0000-4000-8000-000000000001",
      b = "10000000-0000-4000-8000-000000000002";
    await db.query("insert into auth.users(id) values($1),($2)", [a, b]);
    async function asUser<T>(
      id: string,
      fn: (
        tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
      ) => Promise<T>,
    ) {
      return db.transaction(async (tx) => {
        await tx.exec("set local role authenticated");
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
          id,
        ]);
        return fn(tx);
      });
    }
    const created = await asUser(a, async (tx) => {
      const r = await tx.query<{ id: string }>(
        "select public.save_brief(null,'{}',null,null,'{}') as id",
      );
      await tx.query(
        "insert into storage.objects(bucket_id,name) values('campaign-assets',$1)",
        [a + "/reference.png"],
      );
      return r.rows[0].id;
    });
    await asUser(b, async (tx) => {
      assert.equal(
        (await tx.query("select * from public.campaigns")).rows.length,
        0,
      );
      assert.equal(
        (await tx.query("select * from public.briefs")).rows.length,
        0,
      );
      assert.equal(
        (await tx.query("select * from storage.objects")).rows.length,
        0,
      );
      assert.equal(
        (
          await tx.query(
            "delete from public.campaigns where id=$1 returning id",
            [created],
          )
        ).rows.length,
        0,
      );
    });
    await assert.rejects(
      asUser(b, (tx) =>
        tx.query(
          "insert into storage.objects(bucket_id,name) values('campaign-assets',$1)",
          [a + "/forged.png"],
        ),
      ),
      /row-level security/,
    );
    await assert.rejects(
      asUser(b, (tx) =>
        tx.query(
          "insert into public.campaign_milestones(id,campaign_id,payload) values(gen_random_uuid(),$1,'{}')",
          [created],
        ),
      ),
      /foreign key/,
    );
    await asUser(a, async (tx) => {
      const row = (
        await tx.query<{ updated_at: string }>(
          "select updated_at::text from public.campaigns where id=$1",
          [created],
        )
      ).rows[0];
      await tx.query(
        "select public.save_campaign($1,$2,'In Progress',null,'{}','[]')",
        [created, row.updated_at],
      );
    });
    await assert.rejects(
      asUser(a, (tx) =>
        tx.query(
          "select public.save_campaign($1,'2000-01-01','Draft',null,'{}','[]')",
          [created],
        ),
      ),
      /Version conflict/,
    );
    await asUser(a, async (tx) => {
      for (let i = 0; i < 11; i++) {
        const result = await tx.query<{ allowed: boolean }>(
          "select public.consume_ai_quota() as allowed",
        );
        assert.equal(result.rows[0].allowed, i < 10);
      }
    });
    await assert.rejects(
      asUser(a, (tx) => tx.query("delete from public.ai_usage")),
      /permission denied/,
    );
    await db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      assert.equal(
        (await tx.query("select * from public.creators")).rows.length,
        8,
      );
    });
    await assert.rejects(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return tx.query("select * from public.briefs");
      }),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
