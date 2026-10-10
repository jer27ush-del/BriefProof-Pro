import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/config";
function protectedPath(path: string) {
  return (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/brief" ||
    path.startsWith("/brief/") ||
    path === "/reset-password"
  );
}
function loginRedirect(request: NextRequest, response?: NextResponse) {
  const url = new URL("/login", request.url);
  url.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  const redirect = NextResponse.redirect(url);
  response?.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured())
    return protectedPath(request.nextUrl.pathname)
      ? loginRedirect(request)
      : NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && protectedPath(request.nextUrl.pathname))
    return loginRedirect(request, response);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
