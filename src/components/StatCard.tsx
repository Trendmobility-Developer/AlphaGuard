export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex-1 rounded-xl border border-black/10 bg-white p-4">
      <div className="text-2xl font-extrabold text-brand">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}
