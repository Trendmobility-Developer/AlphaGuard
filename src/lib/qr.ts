import QRCode from 'qrcode';

/** Pairing payload the Android app scans to configure Backend Sync in one shot. */
export interface PairingPayload {
  url: string;
  key: string;
  name: string;
}

export async function pairingQrDataUrl(payload: PairingPayload): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(payload), { margin: 1, width: 220 });
}
