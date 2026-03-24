import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseUrl(): string {
  const u = process.env.SUPABASE_URL;
  if (!u) throw new Error("SUPABASE_URL is required");
  return u;
}

/** Anonymous client — public reads (courses, jobs, resources) where RLS allows. */
export function createAnonClient(): SupabaseClient {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY is required");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** User-scoped client — RLS applies as the signed-in user. */
export function createUserClient(accessToken: string): SupabaseClient {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY is required");
  return createClient(getSupabaseUrl(), key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service role — seed script / automation only (bypasses RLS). */
export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
