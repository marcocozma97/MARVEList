import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import WatcherIntro from '../components/WatcherIntro';
import { FAQ_SECTIONS as SECTIONS, nodeText } from '../utils/faq';

const SEARCHABLE = SECTIONS.map(section => ({
  ...section,
  items: section.items.map((it, i) => ({ ...it, key: `${section.id}-${i}`, text: `${it.q} ${nodeText(it.a)}`.toLowerCase() })),
}));
const TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0);

const Faq = () => {
  const [open, setOpen] = useState<string | null>('base-0');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  // L'intro riparte ogni volta che si entra nelle FAQ, come quella del Daily Bugle
  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);

  const normalized = query.trim().toLowerCase();
  const sections = useMemo(() => SEARCHABLE
    .filter(section => !category || section.id === category)
    .map(section => ({ ...section, items: section.items.filter(it => !normalized || it.text.includes(normalized)) }))
    .filter(section => section.items.length > 0), [normalized, category]);
  const found = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="faq-page">
      {showIntro && <WatcherIntro onDone={finishIntro} />}
      <div className="faq-sky" aria-hidden="true" />

      <div className={`container page faq-content ${showIntro ? 'is-waiting' : 'is-revealed'}`}>
        <header className="faq-hero">
          <span className="faq-kicker">L'Osservatore risponde</span>
          <h1 className="faq-title">Domande frequenti</h1>
          <p className="faq-lead">
            Dalla Luna blu l'Osservatore vede tutto ciò che accade su MARVEList: {TOTAL} risposte su Timeline, maratone, gradi e molto altro.
          </p>

          <div className="faq-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input
              type="search"
              placeholder="Cerca una domanda o una parola…"
              aria-label="Cerca nelle FAQ"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {normalized && <span className="faq-search-count">{found} {found === 1 ? 'risultato' : 'risultati'}</span>}
          </div>

          <div className="faq-chips" role="group" aria-label="Filtra per argomento">
            <button type="button" className={`faq-chip ${category ? '' : 'active'}`} aria-pressed={!category} onClick={() => setCategory(null)}>
              Tutte
            </button>
            {SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                className={`faq-chip ${category === section.id ? 'active' : ''}`}
                aria-pressed={category === section.id}
                onClick={() => setCategory(category === section.id ? null : section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
        </header>

        {sections.length === 0 && (
          <div className="faq-empty">
            <p>Nemmeno l'Osservatore ha visto "{query}".</p>
            <button type="button" className="faq-chip" onClick={() => { setQuery(''); setCategory(null); }}>Azzera la ricerca</button>
          </div>
        )}

        {sections.map(section => (
          <section key={section.id} className="faq-section">
            <h2 className="faq-section-title">{section.title}</h2>
            <div className="faq-list">
              {section.items.map(({ key, q, a }) => {
                // Durante la ricerca le risposte trovate sono già aperte
                const isOpen = !!normalized || open === key;
                return (
                  <div key={key} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <h3>
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => setOpen(open === key ? null : key)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${key}`}
                      >
                        <span>{q}</span>
                        <span className="faq-toggle" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6" /></svg>
                        </span>
                      </button>
                    </h3>
                    <div className="faq-answer" id={`faq-a-${key}`} inert={!isOpen}>
                      <div className="faq-answer-inner">
                        <p>{a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="faq-cta">
          <div>
            <strong>Non hai trovato la risposta?</strong>
            <span>J.A.I.R.V.I.S. conosce l'Universo Marvel meglio di chiunque altro (Osservatore escluso).</span>
          </div>
          <Link to="/jairvis" className="faq-cta-btn">Chiedi a J.A.I.R.V.I.S.</Link>
        </div>
      </div>
    </div>
  );
};

export default Faq;
