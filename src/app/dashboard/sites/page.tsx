import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import type { Site } from '@/lib/types';
import { deleteSite } from '../actions';
import { NewSiteForm } from './NewSiteForm';

export default async function SitesPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-brand">Add a gate / scanner device</h2>
        <NewSiteForm />
      </div>

      <div className="rounded-xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-bold text-brand">
          Sites &amp; API keys
        </div>
        {(sites as Site[] | null)?.length ? (
          <ul className="divide-y divide-black/5">
            {(sites as Site[]).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="font-mono text-xs text-gray-500">{s.api_key}</div>
                </div>
                <form action={deleteSite.bind(null, s.id)}>
                  <button className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-500">No sites yet — add one above.</p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Put a site&apos;s API key into the AlphaGuard app&apos;s Settings → Backend Sync, along with this
        dashboard&apos;s URL, so its scans show up here.
      </p>
    </div>
  );
}
