import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BugleIntro from '../components/BugleIntro';
import MediaPoster from '../components/MediaPoster';
import { newsService, type NewsArticle } from '../services/newsService';
import { mediaService, type MediaItem } from '../services/mediaService';
import { availableFrom, isUpcoming } from '../utils/upcoming';
import { parseDay, toIsoDay } from '../utils/marathon';
import { findMentionedMedia, timeAgo } from '../utils/news';

const UPCOMING_LIMIT = 6;

const countdown = (media: MediaItem) => {
  if (!media.releaseDate) return `Previsto nel ${media.releaseYear}`;
  const days = Math.round((parseDay(media.releaseDate).getTime() - parseDay(toIsoDay(new Date())).getTime()) / 86_400_000);
  if (days <= 0) return 'Esce oggi';
  if (days === 1) return 'Esce domani';
  return `Tra ${days} giorni`;
};

const NewsItem = ({ article, media }: { article: NewsArticle; media: MediaItem | null }) => (
  <div className="np-news">
    {media && (
      <Link to={`/media/${media.id}`} className="np-news-photo" aria-label={`Apri la scheda di ${media.title}`}>
        <MediaPoster media={media} className="np-news-poster" />
      </Link>
    )}
    <div className="np-news-text">
      <span className="np-byline">{article.source} · {timeAgo(article.publishedAt)}</span>
      <a href={article.link} target="_blank" rel="noopener noreferrer" className="np-news-headline">{article.title}</a>
      {media && <Link to={`/media/${media.id}`} className="np-news-media">Scheda: {media.title}</Link>}
    </div>
  </div>
);

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // L'intro riparte ogni volta che si entra nelle News, come l'avvio di J.A.I.R.V.I.S.
  const [showBugle, setShowBugle] = useState(true);
  const finishBugle = useCallback(() => setShowBugle(false), []);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    newsService.getLatest()
      .then(setArticles)
      .catch(() => setError('Le rotative del Daily Bugle sono ferme: riprova tra qualche minuto.'))
      .finally(() => setIsLoading(false));
    // Senza accesso il catalogo non arriva: le notizie si leggono lo stesso, solo senza locandine
    mediaService.getAllMedia().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  // La data di testata cambia da sola a mezzanotte se la pagina resta aperta
  useEffect(() => {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 1, 0);
    const timer = window.setTimeout(() => setNow(new Date()), midnight.getTime() - now.getTime());
    return () => window.clearTimeout(timer);
  }, [now]);

  const mentioned = useMemo(
    () => new Map(articles.map(a => [a.link, findMentionedMedia(a.title, catalog)])),
    [articles, catalog]
  );

  const upcoming = useMemo(() => catalog
    .filter(m => isUpcoming(m))
    .sort((a, b) => availableFrom(a)!.localeCompare(availableFrom(b)!))
    .slice(0, UPCOMING_LIMIT), [catalog]);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? articles.filter(a => `${a.title} ${a.source}`.toLowerCase().includes(normalized))
    : articles;
  const [lead, ...rest] = filtered;
  const leadMedia = lead ? mentioned.get(lead.link) ?? null : null;
  const today = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="news-page">
      {showBugle && <BugleIntro onDone={finishBugle} />}

      <div className="container page">
        <article className="newspaper">
          <header className="np-masthead">
            <div className="np-ears">
              <span>Edizione del giorno · {articles.length} notizie</span>
              <span className="np-date">{today}</span>
              <span>Prezzo: gratis</span>
            </div>
            <h1 className="np-title">Daily Bugle</h1>
            <div className="np-motto">«Le notizie che New York merita»</div>
            <nav className="np-sections" aria-label="Sezioni del giornale">
              <a href="#np-front">Prima pagina</a>
              <a href="#np-latest">Ultim'ora</a>
              <a href="#np-upcoming" className={upcoming.length ? '' : 'is-empty'}>In arrivo</a>
            </nav>
          </header>

          {isLoading && <p className="np-empty">Le rotative sono in funzione…</p>}
          {error && <p className="np-empty">{error}</p>}

          {!isLoading && !error && (
            <>
              <section className="np-front" id="np-front">
                {lead ? (
                  <div className="np-lead">
                    <span className="np-kicker">{normalized ? 'Dall\'archivio' : 'Ultim\'ora'}</span>
                    <h2 className="np-headline">
                      <a href={lead.link} target="_blank" rel="noopener noreferrer">{lead.title}</a>
                    </h2>
                    <p className="np-deck">
                      Di {lead.source} · {timeAgo(lead.publishedAt)}
                      {leadMedia && <> · <Link to={`/media/${leadMedia.id}`}>apri la scheda di {leadMedia.title}</Link></>}
                    </p>
                  </div>
                ) : (
                  <p className="np-empty">Nessuna notizia trovata per "{query}". Prova con un'altra parola.</p>
                )}
                {leadMedia ? (
                  <Link to={`/media/${leadMedia.id}`} className="np-lead-photo" aria-label={`Apri la scheda di ${leadMedia.title}`}>
                    <MediaPoster media={leadMedia} className="np-news-poster" showTitle />
                  </Link>
                ) : (
                  <aside className="np-quote">
                    <span className="np-quote-mark" aria-hidden="true">“</span>
                    <p>Voglio notizie, e le voglio adesso! E portatemi delle foto di Spider-Man!</p>
                    <cite>J. Jonah Jameson, direttore</cite>
                  </aside>
                )}
              </section>

              <div className="np-search">
                <label htmlFor="news-search" className="np-search-label">Cerca tra le notizie</label>
                <input
                  id="news-search"
                  type="search"
                  className="np-search-input"
                  placeholder="Es. Doomsday, VisionQuest, X-Men…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="np-columns">
                <section id="np-latest" className="np-section">
                  <h2 className="np-section-title"><span>Ultim'ora</span>Dal mondo Marvel</h2>
                  {rest.length === 0
                    ? <p className="np-empty">Nessun'altra notizia.</p>
                    : rest.map(a => <NewsItem key={a.link} article={a} media={mentioned.get(a.link) ?? null} />)}
                </section>

                <section id="np-upcoming" className="np-section">
                  <h2 className="np-section-title"><span>In arrivo</span>Prossime uscite</h2>
                  {upcoming.length === 0 ? (
                    <p className="np-empty">{catalog.length ? 'Nessuna uscita annunciata al momento.' : <><Link to="/login">Accedi</Link> per vedere le prossime uscite del catalogo.</>}</p>
                  ) : upcoming.map(media => (
                    <Link key={media.id} to={`/media/${media.id}`} className="np-upcoming">
                      <MediaPoster media={media} className="np-news-poster" />
                      <span>
                        <span className="np-byline">{countdown(media)}</span>
                        <strong>{media.title}</strong>
                        <small>{media.type === 'FILM' ? 'Film' : 'Serie TV'} · {media.phase}</small>
                      </span>
                    </Link>
                  ))}
                </section>
              </div>
            </>
          )}

          <footer className="np-footer">
            <span>Notizie da Google News · gli articoli si aprono sul sito della testata</span>
            <span>Hai una domanda su MARVEList? <Link to="/faq">Leggi le FAQ</Link></span>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default News;
