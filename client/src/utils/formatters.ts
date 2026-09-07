import { DateTime } from 'luxon';

export function formatTime(isoString?: string | Date, timezone = 'Asia/Kolkata'): string {
  if (!isoString) return '--:--';
  const dt = typeof isoString === 'string' ? DateTime.fromISO(isoString) : DateTime.fromJSDate(isoString);
  return dt.setZone(timezone).toFormat('hh:mm a');
}

export function formatDate(isoString?: string | Date, timezone = 'Asia/Kolkata'): string {
  if (!isoString) return '--';
  const dt = typeof isoString === 'string' ? DateTime.fromISO(isoString) : DateTime.fromJSDate(isoString);
  return dt.setZone(timezone).toFormat('dd LLL yyyy');
}

export function formatDateTime(isoString?: string | Date, timezone = 'Asia/Kolkata'): string {
  if (!isoString) return '--';
  const dt = typeof isoString === 'string' ? DateTime.fromISO(isoString) : DateTime.fromJSDate(isoString);
  return dt.setZone(timezone).toFormat('dd LLL yyyy, hh:mm:ss a');
}

export function calculateRemainingTime(endAtIsoString?: string | Date): {
  hours: string;
  minutes: string;
  seconds: string;
  isExpired: boolean;
  totalSeconds: number;
} {
  if (!endAtIsoString) {
    return { hours: '00', minutes: '00', seconds: '00', isExpired: true, totalSeconds: 0 };
  }

  const end = typeof endAtIsoString === 'string' ? new Date(endAtIsoString).getTime() : endAtIsoString.getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((end - now) / 1000));

  if (diff <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', isExpired: true, totalSeconds: 0 };
  }

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    isExpired: false,
    totalSeconds: diff
  };
}
