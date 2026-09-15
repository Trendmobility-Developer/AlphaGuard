import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionsToCsv } from '@/lib/csv';
import type { Session } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const q = params.get('q')?.trim();
  const from = params.get('from');

  let query = supabase.from('sessions').select('*').order('check_in_time', { ascending: false }).limit(100_000);
  if (q) {
    const like = `%${q}%`;
    query = query.or(`driver_name.ilike.${like},id_number.ilike.${like},vehicle_reg.ilike.${like}`);
  }
  if (from) query = query.gte('check_in_time', new Date(from).getTime());

  const { data } = await query;
  const csv = sessionsToCsv((data as Session[]) ?? []);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alphaguard_${Date.now()}.csv"`,
    },
  });
}
