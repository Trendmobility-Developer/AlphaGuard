import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { IngestSession } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function authenticateSite(request: NextRequest) {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return null;
  const apiKey = header.slice('Bearer '.length).trim();
  if (!apiKey) return null;

  const admin = createAdminClient();
  const { data: site } = await admin
    .from('sites')
    .select('id, org_id, name')
    .eq('api_key', apiKey)
    .single();

  return site;
}

function toRow(s: IngestSession, orgId: string, siteId: string, deviceName: string) {
  return {
    id: s.id,
    org_id: orgId,
    site_id: siteId,
    device_name: deviceName,
    session_type: s.sessionType,
    driver_name: s.driverName ?? null,
    id_number: s.idNumber ?? null,
    license_number: s.licenseNumber ?? null,
    license_valid: s.licenseValid ?? null,
    license_expiry: s.licenseExpiry ?? null,
    nationality: s.nationality ?? null,
    gender: s.gender ?? null,
    date_of_birth: s.dateOfBirth ?? null,
    vehicle_reg: s.vehicleReg ?? null,
    vehicle_make: s.vehicleMake ?? null,
    vehicle_vin: s.vehicleVin ?? null,
    vehicle_color: s.vehicleColor ?? null,
    vehicle_weight: s.vehicleWeight ?? null,
    disk_expiry: s.diskExpiry ?? null,
    disk_valid: s.diskValid ?? null,
    check_in_time: s.checkInTime,
    check_out_time: s.checkOutTime ?? null,
    duration_ms: s.durationMs ?? null,
    status: s.status,
    flagged: s.flagged ?? false,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const site = await authenticateSite(request);
  if (!site) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const sessions = Array.isArray(body) ? body : [body];
  if (sessions.length === 0 || sessions.length > 100) {
    return NextResponse.json({ error: 'expected 1-100 sessions' }, { status: 400 });
  }

  const rows = (sessions as IngestSession[]).map((s) => toRow(s, site.org_id, site.id, site.name));

  const admin = createAdminClient();
  const { error } = await admin.from('sessions').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('session upsert failed', error.message);
    return NextResponse.json({ error: 'write failed' }, { status: 500 });
  }

  await admin.from('sites').update({ last_seen_at: new Date().toISOString() }).eq('id', site.id);

  return NextResponse.json({ ok: true, count: rows.length });
}
