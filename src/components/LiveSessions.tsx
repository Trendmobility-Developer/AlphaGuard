'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@/lib/types';
import { SessionsTable } from './SessionsTable';

export type LiveMode = 'active' | 'flagged';

function matches(mode: LiveMode, s: Session): boolean {
  return mode === 'active' ? s.status === 'IN_PROGRESS' : s.flagged;
}

/**
 * Renders `initial`, then keeps itself in sync via Supabase Realtime — no
 * manual refresh needed. `mode` is a plain string (not a function — functions
 * can't cross the Server -> Client Component boundary) narrowing which rows
 * this view cares about. Realtime still only ever delivers rows the viewer's
 * RLS policy allows.
 *
 * IMPORTANT: `createBrowserClient` does NOT wire the Realtime socket to the
 * logged-in user's session token on its own — without an explicit
 * `realtime.setAuth(token)`, every postgres_changes subscription connects
 * under the anon token, RLS then allows nothing through, and events silently
 * never arrive (no error, it just looks like "doesn't auto-refresh"). We set
 * it before subscribing and again on every token refresh.
 */
export function LiveSessions({ initial, mode }: { initial: Session[]; mode: LiveMode }) {
  const [sessions, setSessions] = useState(initial);

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
        .channel('sessions-live')
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

  return <SessionsTable sessions={sessions.filter((s) => matches(mode, s))} />;
}
