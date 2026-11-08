export const seasonNumber = (title: string): number => {
  const match = title.match(/\s+(Season|S\.)\s*(\d+)$/i);
  return match ? Number(match[2]) : 1;
};

export const seriesTitle = (title: string): string => title.replace(/\s+(Season|S\.)\s*\d+$/i, '');

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60]
];

const relative = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

export const timeAgo = (iso: string, now = Date.now()): string => {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(seconds) < 60) return 'adesso';
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'adesso';
};

export const fullDate = (iso: string): string =>
  new Date(iso).toLocaleString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const MAX_COMMENT_LENGTH = 1500;
