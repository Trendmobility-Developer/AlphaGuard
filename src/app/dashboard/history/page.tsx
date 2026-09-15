import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { SessionsTable } from '@/components/SessionsTable';
import type { Session } from '@/lib/types';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string }>;
}) {
  const { q = '', from = '' } = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from('sessions')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('check_in_time', { ascending: false })
    .limit(500);

  if (q.trim()) {
    const like = `%${q.trim()}%`;
    query = query.or(`driver_name.ilike.${like},id_number.ilike.${like},vehicle_reg.ilike.${like}`);
  }
  if (from) {
    query = query.gte('check_in_time', new Date(from).getTime());
  }

  const { data: sessions } = await query;
  const exportQuery = new URLSearchParams({ ...(q && { q }), ...(from && { from }) }).toString();

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-center gap-2" action="/dashboard/history">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, ID or reg…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button className="rounded-lg bg-brand-mid px-4 py-1.5 text-sm font-semibold text-white">
          Filter
        </button>
        <a
          href={`/api/sessions/export.csv?${exportQuery}`}
          className="ml-auto rounded-lg border border-black/10 bg-white px-4 py-1.5 text-sm font-semibold text-brand-mid"
        >
          Export CSV
        </a>
      </form>
      <SessionsTable sessions={(sessions as Session[]) ?? []} />
    </div>
  );
}
