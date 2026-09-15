import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function authenticateSite(request: NextRequest) {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return null;
  const apiKey = header.slice('Bearer '.length).trim();
  if (!apiKey) return null;

  const admin = createAdminClient();
  const { data: site } = await admin.from('sites').select('id, org_id').eq('api_key', apiKey).single();
  return site;
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/v1/sessions/[id]/photo'>) {
  const { id } = await ctx.params;
  const site = await authenticateSite(request);
  if (!site) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: session } = await admin
    .from('sessions')
    .select('id, org_id')
    .eq('id', id)
    .eq('org_id', site.org_id)
    .single();
  if (!session) return NextResponse.json({ error: 'unknown session' }, { status: 404 });

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return NextResponse.json({ error: 'empty body' }, { status: 400 });
  if (bytes.byteLength > 5_000_000) return NextResponse.json({ error: 'photo too large' }, { status: 413 });

  const contentType = request.headers.get('Content-Type') ?? 'image/png';
  const path = `${session.org_id}/${session.id}.png`;

  const { error: uploadError } = await admin.storage.from('photos').upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (uploadError) {
    console.error('photo upload failed', uploadError.message);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }

  await admin.from('sessions').update({ photo_path: path }).eq('id', session.id);

  return NextResponse.json({ ok: true });
}
