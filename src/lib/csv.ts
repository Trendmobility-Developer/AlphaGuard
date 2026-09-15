import type { Session } from './types';
import { formatDateTime, formatDuration } from './format';

const HEADER =
  'Session ID,Type,Driver Name,ID Number,License Number,' +
  'Vehicle Reg,Vehicle Make,Vehicle VIN,Vehicle Color,Vehicle Weight,' +
  'Disk Expiry,Nationality,Gender,Date of Birth,' +
  'Check In,Check Out,Duration,' +
  'License Valid,Disk Valid,Status,Flagged';

const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function sessionsToCsv(rows: Session[]): string {
  const lines = [HEADER];
  for (const s of rows) {
    lines.push(
      [
        esc(s.id),
        esc(s.session_type),
        esc(s.driver_name),
        esc(s.id_number),
        esc(s.license_number),
        esc(s.vehicle_reg),
        esc(s.vehicle_make),
        esc(s.vehicle_vin),
        esc(s.vehicle_color),
        esc(s.vehicle_weight),
        esc(s.disk_expiry),
        esc(s.nationality),
        esc(s.gender),
        esc(s.date_of_birth),
        esc(formatDateTime(s.check_in_time)),
        esc(s.check_out_time ? formatDateTime(s.check_out_time) : ''),
        esc(s.duration_ms != null ? formatDuration(s.duration_ms) : ''),
        esc(s.license_valid ? 'VALID' : 'EXPIRED'),
        esc(s.disk_valid ? 'VALID' : 'EXPIRED'),
        esc(s.status),
        esc(s.flagged ? 'YES' : 'NO'),
      ].join(','),
    );
  }
  return lines.join('\n');
}
