import { useState, useRef, useEffect } from 'react';
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

const SUGGESTIONS = [
  "In che ordine guardo l'MCU?",
  'Consigliami una serie da vedere',
  'Chi sono i Thunderbolts?',
  'Spiegami il Multiverso',
];

const Jairvis = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Sistemi online. Salve signore, sono J.A.I.R.V.I.S. Come posso assisterla con il catalogo Marvel oggi?", sender: 'jairvis' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [globeSize, setGlobeSize] = useState(() => Math.min(360, window.innerWidth - 64));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!isBooting) inputRef.current?.focus({ preventScroll: true });
  }, [isBooting]);

  const send = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || isTyping) return;
    setInput('');

    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: 'user' }]);

    setIsTyping(true);

    const reply = await jairvisService.sendMessage(userMessage);

    setIsTyping(false);
    setMessages(prev => [...prev, { id: Date.now(), text: reply, sender: 'jairvis' }]);
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

  const showSuggestions = messages.length === 1 && !isTyping;

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
              <span className={`jv-status ${isTyping ? 'is-thinking' : ''}`}>
                <span className="jv-status-dot" aria-hidden="true" />
                {isTyping ? 'Elaborazione in corso…' : 'Online · rete neurale attiva'}
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
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" className="jv-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="jv-form">
            <input
              ref={inputRef}
              type="text"
              className="jv-input"
              placeholder="Scrivi a J.A.I.R.V.I.S."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              autoComplete="off"
              aria-label="Messaggio per J.A.I.R.V.I.S."
            />
            <button type="submit" className="jv-send" disabled={isTyping || !input.trim()} aria-label="Invia">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5Z" fill="currentColor" /></svg>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Jairvis;
