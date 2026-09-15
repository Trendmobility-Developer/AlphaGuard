'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/dal';
import { randomApiKey } from '@/lib/format';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function toggleFlag(sessionId: string, flagged: boolean) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from('sessions')
    .update({ flagged })
    .eq('id', sessionId)
    .eq('org_id', profile.org_id); // belt-and-braces; RLS already enforces this
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/history');
  revalidatePath('/dashboard/flagged');
}

export async function createSite(_prevState: string | undefined, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return 'Name required.';

  const { profile } = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from('sites')
    .insert({ org_id: profile.org_id, name, api_key: randomApiKey() });
  if (error) return error.message;

  revalidatePath('/dashboard/sites');
  return undefined;
}

export async function deleteSite(siteId: string) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  await supabase.from('sites').delete().eq('id', siteId).eq('org_id', profile.org_id);
  revalidatePath('/dashboard/sites');
}
