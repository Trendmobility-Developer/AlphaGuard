import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/StatCard';
import { LiveSessions } from '@/components/LiveSessions';
import type { Session } from '@/lib/types';

export default async function OnPremisesPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: sessions }, { count: inCount }, { count: outCount }, { count: activeCount }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('org_id', profile.org_id)
        .eq('status', 'IN_PROGRESS')
        .order('check_in_time', { ascending: false }),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .gte('check_in_time', todayStart.getTime()),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .eq('status', 'COMPLETED')
        .gte('check_in_time', todayStart.getTime()),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .eq('status', 'IN_PROGRESS'),
    ]);

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <StatCard label="In today" value={inCount ?? 0} />
        <StatCard label="Out today" value={outCount ?? 0} />
        <StatCard label="On premises now" value={activeCount ?? 0} />
      </div>
      <LiveSessions initial={(sessions as Session[]) ?? []} filter={(s) => s.status === 'IN_PROGRESS'} />
    </div>
  );
}
