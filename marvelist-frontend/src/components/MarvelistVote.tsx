import type { CommunityRating } from '../services/communityService';

const formatVote = (value: number) => value.toFixed(1).replace('.', ',');

// Chip accanto al voto TMDB: media dei voti di tutti gli utenti di MARVEList
const MarvelistVote = ({ rating }: { rating: CommunityRating | null | undefined }) => {
  if (!rating) return null;
  if (!rating.count || rating.average == null) {
    return <span className="chip chip-marvelist is-empty" title="Nessun utente ha ancora votato">MARVEList · nessun voto</span>;
  }
  const votes = rating.count === 1 ? '1 voto' : `${rating.count} voti`;
  return (
    <span className="chip chip-marvelist" title={`Media di ${votes} degli utenti di MARVEList`} aria-label={`Voto MARVEList ${formatVote(rating.average)} su 10, ${votes}`}>
      ★ {formatVote(rating.average)} MARVEList <small>({votes})</small>
    </span>
  );
};

export default MarvelistVote;
