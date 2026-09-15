import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

/**
 * Verifies the caller is logged in and returns their profile (which carries
 * org_id). Every dashboard page/route should call this before touching data
 * — RLS also enforces the org boundary at the database, this is just the
 * app-level check + a place to redirect unauthenticated visitors.
 */
export async function requireProfile(): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) redirect('/login');

  return { userId: user.id, profile };
}
