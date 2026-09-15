import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/photo/[id]'>) {
  const { id } = await ctx.params;

  // RLS-scoped client: this SELECT only succeeds if the row is in the caller's org.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: session } = await supabase
    .from('sessions')
    .select('photo_path')
    .eq('id', id)
    .single();
  if (!session?.photo_path) return NextResponse.json({ error: 'no photo' }, { status: 404 });

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from('photos').download(session.photo_path);
  if (error || !file) return NextResponse.json({ error: 'no photo' }, { status: 404 });

  return new NextResponse(file, {
    headers: { 'Content-Type': file.type || 'image/png', 'Cache-Control': 'private, max-age=300' },
  });
}
