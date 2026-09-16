import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { LiveHomeBoard } from '@/components/LiveHomeBoard';
import type { Session } from '@/lib/types';

export default async function OnPremisesPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  // One query covers all three tabs: everything still on premises, plus
  // everything checked in today (whether it's out again or not yet).
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('org_id', profile.org_id)
    .or(`status.eq.IN_PROGRESS,check_in_time.gte.${todayStartMs}`)
    .order('check_in_time', { ascending: false })
    .limit(1000);

  return <LiveHomeBoard initial={(sessions as Session[]) ?? []} todayStart={todayStartMs} />;
}
