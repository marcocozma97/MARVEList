// Tempo di visione diviso in mesi, giorni, ore e minuti (da sinistra a destra).
// Si passa a 1 giorno solo oltre le 24 ore e a 1 mese solo oltre i 30 giorni; le unità a zero non si mostrano.
// Sullo schermo le unità sono abbreviate (g, h, m); per i lettori di schermo resta la forma estesa.
export interface WatchTimePart { value: number; unit: string; spoken: string }

const MIN_PER_HOUR = 60;
const MIN_PER_DAY = 24 * MIN_PER_HOUR;
const MIN_PER_MONTH = 30 * MIN_PER_DAY;

export const splitWatchTime = (totalMinutes: number): WatchTimePart[] => {
  const total = Math.max(0, Math.round(totalMinutes));
  let rest = total;
  // Le soglie valgono sul totale: esattamente 24 h restano "24h", esattamente 30 giorni restano "30g"
  const months = total > MIN_PER_MONTH ? Math.floor(rest / MIN_PER_MONTH) : 0; rest -= months * MIN_PER_MONTH;
  const days = total > MIN_PER_DAY ? Math.floor(rest / MIN_PER_DAY) : 0; rest -= days * MIN_PER_DAY;
  const hours = Math.floor(rest / MIN_PER_HOUR); rest -= hours * MIN_PER_HOUR;
  const parts: WatchTimePart[] = [
    { value: months, unit: months === 1 ? 'mese' : 'mesi', spoken: months === 1 ? 'mese' : 'mesi' },
    { value: days, unit: 'g', spoken: days === 1 ? 'giorno' : 'giorni' },
    { value: hours, unit: 'h', spoken: hours === 1 ? 'ora' : 'ore' },
    { value: rest, unit: 'm', spoken: rest === 1 ? 'minuto' : 'minuti' },
  ].filter(p => p.value > 0);
  return parts.length ? parts : [{ value: 0, unit: 'm', spoken: 'minuti' }];
};

// Forma breve, come sullo schermo: "1g 2h 5m"
export const formatWatchTime = (totalMinutes: number) =>
  splitWatchTime(totalMinutes).map(p => `${p.value}${p.unit}`).join(' ');

// Forma estesa per i lettori di schermo: "1 giorno 2 ore 5 minuti"
export const speakWatchTime = (totalMinutes: number) =>
  splitWatchTime(totalMinutes).map(p => `${p.value} ${p.spoken}`).join(' ');
