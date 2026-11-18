import type { TmdbCountryProviders, TmdbProvider } from '../services/tmdbService';

// Bandiera rossa con il teschio a tentacoli dell'Hydra: il titolo è "sparito" dalle piattaforme italiane
const HydraFlag = () => (
  <svg className="hydra-flag" viewBox="0 0 64 48" aria-hidden="true">
    <rect x="2" y="2" width="3" height="44" rx="1.5" fill="#8a8f98" />
    <path d="M5 4h55l-5 15 5 15H5z" fill="#b3121b" stroke="#5c0a0e" strokeWidth="1" />
    <g transform="translate(31 19) scale(0.85)">
      <circle r="8.5" fill="#111" />
      {[0, 60, 120, 180, 240, 300].map(angle => (
        <path
          key={angle}
          d="M0 -6 C3 -9 1 -12 4 -13.5"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${angle})`}
        />
      ))}
      <path d="M-4.2 -1.5a4.2 4.2 0 0 1 8.4 0v2.2l-1.4 1v1.8h-5.6v-1.8l-1.4-1z" fill="#e6e6e6" />
      <circle cx="-1.7" cy="-0.6" r="1.1" fill="#111" />
      <circle cx="1.7" cy="-0.6" r="1.1" fill="#111" />
      <path d="M-1.6 3.2v1.2M0 3.2v1.2M1.6 3.2v1.2" stroke="#111" strokeWidth="0.6" />
    </g>
  </svg>
);

const unique = (lists: (TmdbProvider[] | undefined)[], exclude: Set<number> = new Set()) => {
  const seen = new Set(exclude);
  const result: TmdbProvider[] = [];
  for (const provider of lists.flatMap(list => list ?? [])) {
    if (seen.has(provider.provider_id)) continue;
    seen.add(provider.provider_id);
    result.push(provider);
  }
  return result;
};

const ProviderList = ({ providers, link }: { providers: TmdbProvider[]; link?: string }) => (
  <ul className="watch-provider-list">
    {providers.map(p => (
      <li key={p.provider_id}>
        <a className="watch-provider" href={link} target="_blank" rel="noopener noreferrer" title={`Guarda su ${p.provider_name}`}>
          {p.logo_path && <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt="" loading="lazy" />}
          <span>{p.provider_name}</span>
        </a>
      </li>
    ))}
  </ul>
);

// Dove vedere il titolo in Italia: prima gli abbonamenti e le piattaforme gratuite, poi noleggio e acquisto
const WatchProviders = ({ italy }: { italy?: TmdbCountryProviders }) => {
  const streaming = unique([italy?.flatrate, italy?.free, italy?.ads]);
  const store = unique([italy?.rent, italy?.buy], new Set(streaming.map(p => p.provider_id)));

  return (
    <div className="detail-block watch-providers">
      <h2 className="section-label">Dove vederlo in Italia</h2>
      {streaming.length === 0 && store.length === 0 ? (
        <div className="watch-unavailable">
          <HydraFlag />
          <span>Non disponibile in Italia</span>
        </div>
      ) : (
        <>
          {streaming.length > 0 && <ProviderList providers={streaming} link={italy?.link} />}
          {store.length > 0 && (
            <>
              <p className="watch-provider-kind">{streaming.length > 0 ? 'Anche a noleggio o in acquisto' : 'A noleggio o in acquisto'}</p>
              <ProviderList providers={store} link={italy?.link} />
            </>
          )}
          <p className="watch-provider-source">Dati di JustWatch</p>
        </>
      )}
    </div>
  );
};

export default WatchProviders;
