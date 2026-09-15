'use client';

import { Fragment, useState } from 'react';
import type { Session } from '@/lib/types';
import { formatDateTime, formatDuration } from '@/lib/format';
import { Badge } from './Badge';
import { toggleFlag } from '@/app/dashboard/actions';

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  const [active, setActive] = useState<Session | null>(null);

  if (sessions.length === 0) {
    return <p className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-gray-500">Nothing to show.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">ID number</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Check in</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const ped = s.session_type === 'PEDESTRIAN';
              const out = s.status === 'COMPLETED';
              return (
                <tr
                  key={s.id}
                  onClick={() => setActive(s)}
                  className="cursor-pointer border-b border-black/5 hover:bg-brand-soft/40"
                >
                  <td className="px-3 py-2">{ped ? '🚶' : out ? '↑ OUT' : '↓ IN'}</td>
                  <td className="px-3 py-2">{s.driver_name || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.id_number || '—'}</td>
                  <td className="px-3 py-2">{ped ? '—' : s.vehicle_reg || 'No disc'}</td>
                  <td className="px-3 py-2">{formatDateTime(s.check_in_time)}</td>
                  <td className="px-3 py-2">{s.duration_ms != null ? formatDuration(s.duration_ms) : 'On premises'}</td>
                  <td className="px-3 py-2 text-right">
                    {s.flagged ? (
                      <Badge color="red">⚑ Flagged</Badge>
                    ) : s.status === 'COMPLETED' ? (
                      <Badge color="grey">Completed</Badge>
                    ) : (
                      <Badge color="green">Active</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && <SessionDetail session={active} onClose={() => setActive(null)} />}
    </>
  );
}

function SessionDetail({ session: s, onClose }: { session: Session; onClose: () => void }) {
  const ped = s.session_type === 'PEDESTRIAN';
  const [flagged, setFlagged] = useState(s.flagged);
  const [pending, setPending] = useState(false);

  async function onToggle() {
    setPending(true);
    const next = !flagged;
    setFlagged(next);
    await toggleFlag(s.id, next);
    setPending(false);
  }

  const rows: [string, React.ReactNode][] = [
    ['ID number', s.id_number || '—'],
    ['Type', s.session_type],
    ped ? ['Nationality', s.nationality || '—'] : ['Licence', `${s.license_number || '—'} (${s.license_valid ? 'valid' : 'expired'})`],
    ped ? ['Gender', s.gender || '—'] : ['Licence expiry', s.license_expiry || '—'],
    ped
      ? ['Date of birth', s.date_of_birth || '—']
      : ['Vehicle', s.vehicle_reg ? `${s.vehicle_reg} · ${s.vehicle_make || '—'}` : 'No disc scanned'],
    ...(ped ? [] : ([['VIN', s.vehicle_vin || '—']] as [string, React.ReactNode][])),
    ...(ped
      ? []
      : ([['Disc expiry', s.disk_expiry ? `${s.disk_expiry} (${s.disk_valid ? 'valid' : 'expired'})` : '—']] as [
          string,
          React.ReactNode,
        ][])),
    ['Check in', formatDateTime(s.check_in_time)],
    ['Check out', s.check_out_time ? formatDateTime(s.check_out_time) : 'Still on premises'],
    ['Duration', s.duration_ms != null ? formatDuration(s.duration_ms) : '—'],
    ['Device', s.device_name || '—'],
  ];

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4">
          <h2 className="flex-1 text-base font-bold">{s.driver_name || 'Session'}</h2>
          <button onClick={onClose} className="rounded-lg border border-black/10 px-3 py-1 text-xs font-semibold">
            Close
          </button>
        </div>
        <div className="p-5">
          {s.photo_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/photo/${encodeURIComponent(s.id)}`}
              alt="Licence photo"
              className="mb-3 h-40 w-32 float-right ml-4 rounded-lg border border-black/10 bg-brand-soft object-cover"
            />
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            {rows.map(([k, v]) => (
              <Fragment key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k}</dt>
                <dd className="font-mono">{v}</dd>
              </Fragment>
            ))}
          </dl>
          <button
            onClick={onToggle}
            disabled={pending}
            className={`mt-4 w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              flagged ? 'bg-gray-500' : 'bg-amber-600'
            }`}
          >
            {flagged ? 'Remove flag' : 'Flag session'}
          </button>
        </div>
      </div>
    </div>
  );
}
