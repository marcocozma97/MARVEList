// Tempo di visione diviso in mesi, giorni, ore e minuti (da sinistra a destra).
// Si passa a 1 giorno solo oltre le 24 ore e a 1 mese solo oltre i 30 giorni; le unità a zero non si mostrano.
export interface WatchTimePart { value: number; unit: string }

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;
const MIN_PER_MONTH = 30 * MIN_PER_DAY;

export const splitWatchTime = (totalMinutes: number): WatchTimePart[] => {
  const total = Math.max(0, Math.round(totalMinutes));
  let rest = total;
  // Le soglie valgono sul totale: esattamente 24 h restano "24 h", esattamente 30 giorni restano "30 giorni"
  const months = total > MIN_PER_MONTH ? Math.floor(rest / MIN_PER_MONTH) : 0; rest -= months * MIN_PER_MONTH;
  const days = total > MIN_PER_DAY ? Math.floor(rest / MIN_PER_DAY) : 0; rest -= days * MIN_PER_DAY;
  const hours = Math.floor(rest / MIN_PER_HOUR); rest -= hours * MIN_PER_HOUR;
  const parts: WatchTimePart[] = [
    { value: months, unit: months === 1 ? 'mese' : 'mesi' },
    { value: days, unit: days === 1 ? 'giorno' : 'giorni' },
    { value: hours, unit: 'h' },
    { value: rest, unit: 'min' },
  ].filter(p => p.value > 0);
  return parts.length ? parts : [{ value: 0, unit: 'min' }];
};

export const formatWatchTime = (totalMinutes: number) =>
  splitWatchTime(totalMinutes).map(p => `${p.value} ${p.unit}`).join(' ');
