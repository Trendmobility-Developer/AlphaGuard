const COLORS = {
  green: 'bg-green-600',
  red: 'bg-red-600',
  grey: 'bg-gray-500',
  amber: 'bg-amber-600',
} as const;

export function Badge({ color, children }: { color: keyof typeof COLORS; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${COLORS[color]}`}>
      {children}
    </span>
  );
}
