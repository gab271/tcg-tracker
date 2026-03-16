import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

const ALLOWED_REDIRECTS = ["/dashboard", "/collection", "/decks", "/market", "/profile", "/chat"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Prevent open redirect: only allow known internal paths
  const safeNext = ALLOWED_REDIRECTS.some((path) => next.startsWith(path))
    ? next
    : "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth-callback-failed`);
}
