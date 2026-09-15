export type SessionType = 'CAR' | 'PEDESTRIAN';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

/** Mirrors the `sessions` table. */
export interface Session {
  id: string;
  org_id: string;
  site_id: string | null;
  device_name: string | null;
  session_type: SessionType;
  driver_name: string | null;
  id_number: string | null;
  license_number: string | null;
  license_valid: boolean | null;
  license_expiry: string | null;
  nationality: string | null;
  gender: string | null;
  date_of_birth: string | null;
  vehicle_reg: string | null;
  vehicle_make: string | null;
  vehicle_vin: string | null;
  vehicle_color: string | null;
  vehicle_weight: string | null;
  disk_expiry: string | null;
  disk_valid: boolean | null;
  check_in_time: number;
  check_out_time: number | null;
  duration_ms: number | null;
  status: SessionStatus;
  flagged: boolean;
  photo_path: string | null;
  updated_at: string;
}

export interface Site {
  id: string;
  org_id: string;
  name: string;
  api_key: string;
  last_seen_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string | null;
  role: 'owner' | 'member';
  created_at: string;
}

/** The shape the Android app posts to /api/v1/sessions. */
export interface IngestSession {
  id: string;
  sessionType: SessionType;
  driverName?: string | null;
  idNumber?: string | null;
  licenseNumber?: string | null;
  licenseValid?: boolean | null;
  licenseExpiry?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  vehicleReg?: string | null;
  vehicleMake?: string | null;
  vehicleVin?: string | null;
  vehicleColor?: string | null;
  vehicleWeight?: string | null;
  diskExpiry?: string | null;
  diskValid?: boolean | null;
  checkInTime: number;
  checkOutTime?: number | null;
  durationMs?: number | null;
  status: SessionStatus;
  flagged?: boolean | null;
}
