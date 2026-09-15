'use client';

import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from './actions';

function ConfirmBanner() {
  const justSignedUp = useSearchParams().get('confirm') === '1';
  if (!justSignedUp) return null;
  return (
    <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand">
      Check your email to confirm your account, then sign in.
    </p>
  );
}

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-brand">AlphaGuard</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to your dashboard</p>

        <Suspense fallback={null}>
          <ConfirmBanner />
        </Suspense>

        <form action={formAction} className="space-y-3 text-left">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-mid focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-mid focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-mid py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-xs text-gray-500">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-brand-mid">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
