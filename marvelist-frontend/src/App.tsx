import { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import Navbar from './components/Navbar';
import { HIDDEN_NAVBAR_PATHS } from './utils/navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import FAQ from './pages/Faq';
import News from './pages/News';
import Timeline from './pages/Timeline';
import RoadTo from './pages/RoadTo';
import Profile from './pages/Profile';
import JairvisChat from './components/JairvisChat';
import ScrollTopButton from './components/ScrollTopButton';
import Jairvis from './pages/Jairvis';
import MediaDetail from './pages/MediaDetail';
import EpisodeDetail from './pages/EpisodeDetail';
import MarathonForm from './pages/MarathonForm';
import MarathonDetail from './pages/MarathonDetail';
import InfinityIntro from './components/InfinityIntro';
import { markIntroSeen, shouldShowIntro } from './utils/intro';

const Shell = () => {
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const hasNavbar = !HIDDEN_NAVBAR_PATHS.includes(location.pathname);

  // Intro delle Gemme: decide sessionStorage, lo stato serve solo a ridisegnare quando finisce
  const [, setIntroFinished] = useState(0);
  const showIntro = !['/login', '/register', '/verify'].includes(location.pathname) && shouldShowIntro(location.pathname);
  // Mai nelle pagine d'ingresso (landing, login, register, verify): anche con un token rimasto salvato
  const showJairvisFab = isAuthenticated && hasNavbar && !showIntro && location.pathname !== '/jairvis';
  const finishIntro = useCallback(() => {
    markIntroSeen();
    setIntroFinished(n => n + 1);
  }, []);

  return (
    <>
      <Navbar />

      <main className={`app-main ${hasNavbar ? 'with-navbar' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/road-to" element={<RoadTo />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/news" element={<News />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/media/:id" element={<MediaDetail />} />
          <Route path="/media/:id/episodes/:episode" element={<EpisodeDetail />} />
          <Route path="/jairvis" element={<Jairvis />} />
          <Route path="/marathons/new" element={<MarathonForm />} />
          <Route path="/marathons/:id" element={<MarathonDetail />} />
          <Route path="/marathons/:id/edit" element={<MarathonForm />} />
        </Routes>
      </main>

      {/* Solo per chi ha fatto l'accesso, e mai sopra l'intro iniziale della Timeline */}
      {showJairvisFab && <JairvisChat />}
      {/* In tutte le pagine, sopra il pulsante AI quando c'è */}
      {!showIntro && <ScrollTopButton aboveFab={showJairvisFab} />}

      {/* Intro iniziale: copre tutto, la Timeline intanto si carica sotto */}
      {showIntro && <InfinityIntro onDone={finishIntro} />}
    </>
  );
};

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
