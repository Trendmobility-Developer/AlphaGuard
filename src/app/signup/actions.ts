'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(_prevState: string | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const orgName = String(formData.get('orgName') ?? '');
  const fullName = String(formData.get('fullName') ?? '');

  if (password.length < 8) return 'Password must be at least 8 characters.';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { org_name: orgName, full_name: fullName } },
  });
  if (error) return error.message;

  // If email confirmation is required, signUp succeeds but there's no
  // session yet — send them to check their inbox instead of the dashboard.
  if (!data.session) redirect('/login?confirm=1');

  redirect('/dashboard');
}
