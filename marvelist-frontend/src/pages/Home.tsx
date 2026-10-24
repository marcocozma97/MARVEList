import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import heroImage from '../assets/marvel-bg-home.jpg';
import Brand from '../components/Brand';

const features = [
  { n: '01', title: 'Traccia i tuoi progressi', text: "Segna minuti ed episodi visti e vota ogni titolo da 1 a 10 scudi." },
  { n: '02', title: 'J.A.I.R.V.I.S.', text: 'Chiedi consigli al tuo assistente personale IA su film, serie TV, fumetti e lore.' },
  { n: '03', title: 'Road to...', text: 'Preparati alle nuove uscite e ai grandi eventi Marvel con guide di visione personalizzate.' },
];

const Home = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <div className="home-page">
      <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="home-hero-scrim" />
        <div className="container home-hero-content">
          <span className="home-logo"><Brand size="lg" /></span>
          <h1 className="home-title"><span>Il tuo universo.</span> <span>La tua timeline.</span></h1>
          <p className="home-subtitle">Traccia i film, le serie TV e gestisci le tue fasi MCU.</p>
          <div className="home-actions">
            {/* Senza accesso si passa prima dal login (che porta anche alla registrazione) */}
            <Link to={isAuthenticated ? '/timeline' : '/login'} className="btn-marvel btn-inline btn-lg-pill">Esplora la Timeline</Link>
          </div>
        </div>
      </section>

      <section className="container home-features">
        {features.map(f => (
          <div key={f.n} className="feature-card">
            <span className="feature-number">{f.n}</span>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="container home-footer">
        <p className="home-footer-copy">© {new Date().getFullYear()} MARVEList. Tutti i diritti riservati.</p>
        <p>
          Marvel, i suoi personaggi, le locandine, i trailer e tutti i contenuti e marchi correlati sono proprietà di
          Marvel Entertainment, The Walt Disney Company e dei rispettivi titolari dei diritti.
          MARVEList è un progetto non ufficiale e non è affiliato né approvato da Marvel o Disney.
        </p>
        <p>
          Dati e immagini dei titoli forniti da{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.
        </p>
      </footer>
    </div>
  );
};

export default Home;
