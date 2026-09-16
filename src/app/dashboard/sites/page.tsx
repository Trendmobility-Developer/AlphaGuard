import { headers } from 'next/headers';
import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import type { Site } from '@/lib/types';
import { pairingQrDataUrl } from '@/lib/qr';
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

  const h = await headers();
  const baseUrl = `https://${h.get('x-forwarded-host') ?? h.get('host')}`;

  const withQr = await Promise.all(
    ((sites as Site[] | null) ?? []).map(async (s) => ({
      site: s,
      qr: await pairingQrDataUrl({ url: baseUrl, key: s.api_key, name: s.name }),
    })),
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-brand">Add a gate / scanner device</h2>
        <NewSiteForm />
      </div>

      <div className="rounded-xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-bold text-brand">
          Sites &amp; devices
        </div>
        {withQr.length ? (
          <ul className="divide-y divide-black/5">
            {withQr.map(({ site: s, qr }) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`Pairing QR for ${s.name}`} className="h-24 w-24 rounded-lg border border-black/10" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    On the scanner: Settings → Backend Sync → <span className="font-semibold">Scan QR to pair</span> →
                    point it at this code.
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-gray-400">{s.api_key}</div>
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
        Each site gets its own QR code. Scanning it on the device sets the server URL, API key, and
        device name in one shot — no typing.
      </p>
    </div>
  );
}
