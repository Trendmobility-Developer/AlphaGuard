import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS entirely. Server-only, never import
 * this from a Client Component or anything that ships to the browser.
 * Used only by the device-ingest and photo routes, which do their own
 * authorization (site API key check / org-scoped row lookup) before touching
 * the database.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
