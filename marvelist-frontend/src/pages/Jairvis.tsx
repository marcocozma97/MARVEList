import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { jairvisService } from '../services/jairvisService';
import NeuralGlobe from '../components/NeuralGlobe';
import JairvisMessage from '../components/JairvisMessage';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'jairvis';
}

const BOOT_MS = 3000;

const BOOT_STEPS = [
  'Inizializzazione rete neurale',
  'Connessione agli archivi Stark',
  'Caricamento protocolli Marvel',
];

const INTRO = "Sistemi online. Salve signore, sono **J.A.I.R.V.I.S.**, la nuova intelligenza sperimentale delle **Stark Industries**.\n\n"
  + "Per ora sono attivo in versione demo, con un utilizzo limitato: ogni 24 ore posso rispondere a uno dei suggerimenti rapidi qui sotto e a una domanda scritta da Lei. "
  + "In futuro diventerò lo strumento definitivo degli utenti MARVEList.\n\nCome posso assisterla oggi?";

const MAINTENANCE = "Mi perdoni, signore: in questo momento **DUM-E** e **U** stanno lavorando alla manutenzione dei miei sistemi. Tornerò in funzione molto presto.";

const nextAskLabel = (iso: string) => {
  const next = new Date(iso);
  const time = next.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (next.toDateString() === today.toDateString()) return `oggi alle ${time}`;
  if (next.toDateString() === tomorrow.toDateString()) return `domani alle ${time}`;
  return next.toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const Jairvis = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: INTRO, sender: 'jairvis' }]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nextAskAt, setNextAskAt] = useState<string | null>(null);
  const [nextSuggestionAt, setNextSuggestionAt] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [globeSize, setGlobeSize] = useState(() => Math.min(360, window.innerWidth - 64));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mentre gira l'animazione di avvio si scopre se la domanda di oggi è ancora disponibile
  useEffect(() => {
    if (!isAuthenticated) return;
    jairvisService.status()
      .then(status => {
        setSuggestions(status.suggestions);
        setNextAskAt(status.nextAskAt);
        setNextSuggestionAt(status.nextSuggestionAt);
        if (status.maintenance) {
          setMaintenance(true);
          setMessages(prev => [...prev, { id: 2, text: MAINTENANCE, sender: 'jairvis' }]);
        }
      })
      .catch(console.error);
  }, [isAuthenticated]);

  // Sequenza di avvio: 3 secondi di animazione, poi parte la chat
  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), BOOT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onResize = () => setGlobeSize(Math.min(360, window.innerWidth - 64));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isBooting) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping, isBooting]);

  const canAsk = !nextAskAt && !maintenance;

  useEffect(() => {
    if (!isBooting && canAsk) inputRef.current?.focus({ preventScroll: true });
  }, [isBooting, canAsk]);

  // Allo scadere delle 24 ore domanda e suggerimento tornano disponibili senza ricaricare la pagina
  useEffect(() => {
    const timers = ([[nextAskAt, setNextAskAt], [nextSuggestionAt, setNextSuggestionAt]] as const)
      .filter(([at]) => at)
      .map(([at, reset]) => window.setTimeout(() => reset(null), Math.min(2147483647, Math.max(0, new Date(at as string).getTime() - Date.now()))));
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [nextAskAt, nextSuggestionAt]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const send = async (text: string, suggestion = false) => {
    const userMessage = text.trim();
    if (!userMessage || isTyping || maintenance || (suggestion ? nextSuggestionAt : !canAsk)) return;
    if (!suggestion) setInput('');

    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: 'user' }]);

    setIsTyping(true);

    const result = await jairvisService.sendMessage(userMessage);

    setIsTyping(false);
    setMessages(prev => [...prev, { id: Date.now(), text: result.reply, sender: 'jairvis' }]);
    if (result.status === 'MAINTENANCE') setMaintenance(true);
    if (result.nextAskAt !== undefined) setNextAskAt(result.nextAskAt);
    if (result.nextSuggestionAt !== undefined) setNextSuggestionAt(result.nextSuggestionAt);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  if (isBooting) {
    return (
      <div className="jv-page jv-boot" role="status" aria-live="polite">
        <div className="jv-boot-globe">
          <NeuralGlobe size={globeSize} bootDuration={BOOT_MS - 300} />
          <span className="jv-boot-ring" aria-hidden="true" />
        </div>
        <h1 className="jv-boot-title">J.A.I.R.V.I.S. si sta avviando</h1>
        <div className="jv-boot-bar" aria-hidden="true"><span /></div>
        <ul className="jv-boot-steps" aria-hidden="true">
          {BOOT_STEPS.map((step, i) => (
            <li key={step} style={{ animationDelay: `${i * 0.8 + 0.2}s` }}>{step}</li>
          ))}
        </ul>
      </div>
    );
  }

  const showSuggestions = suggestions.length > 0 && !nextSuggestionAt && !isTyping && !maintenance;
  const quota = maintenance
    ? 'J.A.I.R.V.I.S. è in manutenzione: tornerà presto disponibile'
    : `Demo · ${nextSuggestionAt ? `suggerimento rapido di nuovo ${nextAskLabel(nextSuggestionAt)}` : '1 suggerimento rapido disponibile'}`
      + ` · ${nextAskAt ? `domanda scritta di nuovo ${nextAskLabel(nextAskAt)}` : '1 domanda scritta disponibile'}`;

  return (
    <div className="jv-page">
      <div className="container jv-shell">
        <section className="jv-panel" aria-label="Chat con J.A.I.R.V.I.S.">

          {/* HEADER: mini globo che resta vivo e reagisce quando J.A.I.R.V.I.S. elabora */}
          <header className="jv-header">
            <div className={`jv-header-globe ${isTyping ? 'is-active' : ''}`}>
              <NeuralGlobe size={64} bootDuration={600} active={isTyping} />
            </div>
            <div className="jv-header-text">
              <h1>J.A.I.R.V.I.S.</h1>
              <span className={`jv-status ${isTyping ? 'is-thinking' : ''} ${maintenance && !isTyping ? 'is-down' : ''}`}>
                <span className="jv-status-dot" aria-hidden="true" />
                {isTyping ? 'Elaborazione in corso…' : maintenance ? 'In manutenzione · DUM-E e U al lavoro' : 'Online · rete neurale attiva'}
              </span>
            </div>
          </header>

          <div className="jv-messages" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`jv-row ${msg.sender}`}>
                {msg.sender === 'jairvis' && <span className="jv-orb" aria-hidden="true" />}
                <div className={`jv-bubble ${msg.sender}`}>
                  {msg.sender === 'jairvis' && <span className="jv-bubble-label">J.A.I.R.V.I.S.</span>}
                  {msg.sender === 'jairvis' ? <JairvisMessage text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="jv-row jairvis">
                <span className="jv-orb is-active" aria-hidden="true" />
                <div className="jv-bubble jairvis jv-thinking" aria-label="J.A.I.R.V.I.S. sta elaborando">
                  <span /><span /><span /><span /><span />
                </div>
              </div>
            )}

            {showSuggestions && (
              <div className="jv-suggestions">
                {suggestions.map(s => (
                  <button key={s} type="button" className="jv-chip" onClick={() => send(s, true)}>{s}</button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <p className={`jv-quota ${canAsk ? '' : 'is-locked'}`} role="status">{quota}</p>
          <form onSubmit={handleSend} className="jv-form">
            <input
              ref={inputRef}
              type="text"
              className="jv-input"
              placeholder={maintenance ? 'J.A.I.R.V.I.S. è in manutenzione' : canAsk ? 'Scrivi a J.A.I.R.V.I.S.' : 'Domanda di oggi già usata'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || !canAsk}
              autoComplete="off"
              aria-label="Messaggio per J.A.I.R.V.I.S."
            />
            <button type="submit" className="jv-send" disabled={isTyping || !canAsk || !input.trim()} aria-label="Invia">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5Z" fill="currentColor" /></svg>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Jairvis;
