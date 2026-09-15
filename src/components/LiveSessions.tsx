'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@/lib/types';
import { SessionsTable } from './SessionsTable';

/**
 * Renders `initial`, then keeps itself in sync via Supabase Realtime —
 * no manual refresh needed. `filter` narrows which rows this view cares
 * about (e.g. only IN_PROGRESS, or only flagged); Realtime still only ever
 * delivers rows the viewer's RLS policy allows.
 */
export function LiveSessions({
  initial,
  filter,
}: {
  initial: Session[];
  filter: (s: Session) => boolean;
}) {
  const [sessions, setSessions] = useState(initial);

  useEffect(() => {
    setSessions(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <SessionsTable sessions={sessions.filter(filter)} />;
}
