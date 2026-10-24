// Locandina segnaposto inline, senza servizi esterni
export const POSTER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#151515"/><text x="50%" y="50%" fill="#e23636" font-family="sans-serif" font-size="32" text-anchor="middle">Nessuna Immagine</text></svg>'
)}`;

export const getPosterUrl = (posterPath?: string | null, size = 'w500') => {
  if (!posterPath) return null;
  return posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/${size}${posterPath}`;
};
