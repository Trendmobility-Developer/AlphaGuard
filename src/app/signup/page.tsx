'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from './actions';

export default function SignupPage() {
  const [error, formAction, pending] = useActionState(signup, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-brand">AlphaGuard</h1>
        <p className="mb-6 text-sm text-gray-500">Create your organization</p>

        <form action={formAction} className="space-y-3 text-left">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Company / organization name</label>
            <input
              name="orgName"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-mid focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Your name</label>
            <input
              name="fullName"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-mid focus:outline-none"
            />
          </div>
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
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-mid focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-mid py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-mid">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
