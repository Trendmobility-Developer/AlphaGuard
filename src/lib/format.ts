export function formatDateTime(ms: number | null | undefined): string {
  if (ms == null) return '—';
  return new Date(ms).toLocaleString();
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor(ms / 60_000) % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function randomApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'ag_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
