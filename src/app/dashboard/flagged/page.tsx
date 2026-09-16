import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { LiveSessions } from '@/components/LiveSessions';
import type { Session } from '@/lib/types';

export default async function FlaggedPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('flagged', true)
    .order('check_in_time', { ascending: false });

  return <LiveSessions initial={(sessions as Session[]) ?? []} mode="flagged" />;
}
