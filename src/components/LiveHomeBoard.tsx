'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@/lib/types';
import { SessionsTable } from './SessionsTable';

type Tab = 'active' | 'in' | 'out';

const TABS: { key: Tab; label: string }[] = [
  { key: 'in', label: 'In today' },
  { key: 'out', label: 'Out today' },
  { key: 'active', label: 'On premises now' },
];

/**
 * Home dashboard: the three stat cards double as filter tabs over one live
 * dataset (everything IN_PROGRESS, plus everything checked in today) so
 * clicking "In today" / "Out today" / "On premises now" actually shows those
 * sessions instead of being a dead number. Realtime-updated the same way as
 * LiveSessions — see that file for why `realtime.setAuth()` matters here.
 */
export function LiveHomeBoard({ initial, todayStart }: { initial: Session[]; todayStart: number }) {
  const [sessions, setSessions] = useState(initial);
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    setSessions(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
    });

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) await supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel('sessions-live-home')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions' },
          (payload) => {
            setSessions((prev) => {
              if (payload.eventType === 'DELETE') {
                const oldId = (payload.old as { id?: string }).id;
                return prev.filter((s) => s.id !== oldId);
              }
              const row = payload.new as Session;
              const withoutOld = prev.filter((s) => s.id !== row.id);
              return [row, ...withoutOld].sort((a, b) => b.check_in_time - a.check_in_time);
            });
          },
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime subscription failed', status, err);
          }
        });
    })();

    return () => {
      authSubscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const inToday = useMemo(() => sessions.filter((s) => s.check_in_time >= todayStart), [sessions, todayStart]);
  const outToday = useMemo(() => inToday.filter((s) => s.status === 'COMPLETED'), [inToday]);
  const active = useMemo(() => sessions.filter((s) => s.status === 'IN_PROGRESS'), [sessions]);

  const shown = tab === 'in' ? inToday : tab === 'out' ? outToday : active;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {TABS.map(({ key, label }) => {
          const count = key === 'in' ? inToday.length : key === 'out' ? outToday.length : active.length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`flex-1 rounded-xl border p-4 text-left transition ${
                tab === key
                  ? 'border-brand-mid bg-brand-soft ring-1 ring-brand-mid'
                  : 'border-black/10 bg-white hover:bg-brand-soft/30'
              }`}
            >
              <div className="text-2xl font-extrabold text-brand">{count}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            </button>
          );
        })}
      </div>
      <SessionsTable sessions={shown} />
    </div>
  );
}
