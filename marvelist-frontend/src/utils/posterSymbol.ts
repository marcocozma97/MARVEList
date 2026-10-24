// Simbolo CSS da mostrare al posto di una locandina non trovata, scelto in base al titolo
export type PosterSymbol =
  | 'zodiac' | 'agency' | 'spider' | 'reactor' | 'shield' | 'hammer' | 'gamma' | 'x' | 'four'
  | 'claws' | 'hourglass' | 'mandala' | 'avengers' | 'moon' | 'star' | 'flame' | 'initials';

// L'ordine conta: le regole più specifiche vengono prima (es. "Zodiac" prima di "Agents of S.H.I.E.L.D.")
const RULES: [PosterSymbol, RegExp][] = [
  ['zodiac', /zodiac/],
  ['agency', /s\.h\.i\.e\.l\.d|shield|agent carter|agents of|fury|consultant|item 47|daily bugle/],
  ['spider', /spider|spidey|venom|morbius|kraven|madame web|ragno/],
  ['reactor', /iron ?man|ironheart|iron & /],
  ['shield', /captain america|falcon|winter soldier|capitan/],
  ['hammer', /thor|loki|asgard/],
  ['gamma', /hulk|s\.m\.a\.s\.h/],
  ['x', /x-men|wolverine|logan|deadpool|mutant|legion|gifted|generation x|x '97|mutanti/],
  ['four', /fantastic|fantastici|thing|silver surfer/],
  ['claws', /panther|wakanda/],
  ['hourglass', /widow/],
  ['mandala', /strange|wanda|agatha|vision|scarlet|werewolf/],
  ['moon', /moon/],
  ['star', /guardian|guardiani|groot|rocket|marvels|captain marvel|ms\. marvel|eternals|star/],
  ['flame', /ghost rider|blade|helstrom|punisher|daredevil|elektra|defenders|jessica jones|luke cage|iron fist|zombie/],
  ['avengers', /avengers|ultron|thunderbolts|secret wars|doomsday|vendicator/],
];

export const getPosterSymbol = (title: string): PosterSymbol => {
  const t = title.toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0] ?? 'initials';
};

// Iniziali per il simbolo generico (es. "Cloak & Dagger" -> "CD")
export const getTitleInitials = (title: string) =>
  title.replace(/season\s*\d+|\(.*?\)/gi, '').split(/[\s:&-]+/).filter(w => /^[A-Za-z0-9]/.test(w)).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'M';
