import Link from 'next/link';
import { requireProfile } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { logout } from './actions';

const NAV = [
  { href: '/dashboard', label: 'On premises' },
  { href: '/dashboard/history', label: 'History' },
  { href: '/dashboard/flagged', label: 'Flagged' },
  { href: '/dashboard/sites', label: 'Sites & devices' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 bg-gradient-to-r from-brand to-brand-mid px-5 py-3 text-white">
        <h1 className="flex-1 text-sm font-bold tracking-wide">
          ALPHAGUARD{org?.name ? ` · ${org.name}` : ''}
        </h1>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
            Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl p-5">{children}</main>
    </div>
  );
}
