'use client';

import { useActionState } from 'react';
import { createSite } from '../actions';

export function NewSiteForm() {
  const [error, formAction, pending] = useActionState(createSite, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">New gate / site name</label>
        <input
          name="name"
          required
          placeholder="e.g. Main gate"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-mid px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add site'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
