import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { setProfile } from '../store/authSlice';
import { userService } from '../services/userService';
import { errorMessage } from '../utils/marathon';
import { PRIVACY_CONTACT, PRIVACY_UPDATED } from '../utils/privacy';

const mail = <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>;

// Informativa sul trattamento dei dati personali (art. 13 GDPR)
const Privacy = () => {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const mustAccept = profile?.privacyAccepted === false;

  const accept = async () => {
    setError('');
    setSaving(true);
    try {
      dispatch(setProfile(await userService.acceptPrivacy()));
    } catch (err) {
      setError(errorMessage(err, 'Non siamo riusciti a salvare. Riprova.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container page privacy-page">
      <h1 className="page-title">Informativa sulla privacy</h1>
      <p className="privacy-updated">Ultimo aggiornamento: {PRIVACY_UPDATED}</p>

      <section>
        <p>
          Questa informativa spiega quali dati personali raccoglie MARVEList (il sito e l'app installabile), perché li
          usa, con chi li condivide e quali diritti hai, ai sensi del Regolamento (UE) 2016/679 (GDPR) e della normativa
          italiana sulla protezione dei dati.
        </p>
      </section>

      <section>
        <h2>1. Titolare del trattamento</h2>
        <p>
          Il titolare del trattamento è il gestore di MARVEList, progetto personale e non commerciale.
          Per qualsiasi domanda sui tuoi dati o per esercitare i tuoi diritti puoi scrivere a {mail}.
        </p>
      </section>

      <section>
        <h2>2. Quali dati raccogliamo</h2>
        <ul>
          <li><strong>Dati dell'account:</strong> nome, cognome, indirizzo email e password (salvata solo in forma cifrata, non leggibile neanche da noi).</li>
          <li><strong>Profilo pubblico:</strong> nickname, immagine profilo scelta tra quelle disponibili, grado.</li>
          <li><strong>Attività nell'app:</strong> titoli visti, episodi e minuti guardati, voti, preferiti, "guarda dopo", maratone, commenti, mi piace, utenti seguiti, notifiche e domande fatte a J.A.I.R.V.I.S.</li>
          <li><strong>Dati tecnici:</strong> indirizzo IP e informazioni sul browser registrati automaticamente dai server per il funzionamento e la sicurezza del servizio, e la data di accettazione di questa informativa.</li>
        </ul>
        <p>Non raccogliamo dati di pagamento, dati sulla posizione né categorie particolari di dati (come salute, opinioni o orientamento).</p>
      </section>

      <section>
        <h2>3. Perché li usiamo e su quale base</h2>
        <ul>
          <li><strong>Fornire il servizio</strong> (creare e gestire l'account, salvare i progressi, mostrare maratone, Community e classifiche): esecuzione del contratto, cioè i termini d'uso del servizio che richiedi registrandoti.</li>
          <li><strong>Inviare email di servizio</strong> (conferma della registrazione, recupero della password): esecuzione del contratto.</li>
          <li><strong>Sicurezza</strong> e prevenzione di abusi: legittimo interesse del titolare.</li>
          <li><strong>Statistiche aggregate e anonime</strong> (per esempio il voto medio MARVEList e le classifiche della Community): legittimo interesse; nessun utente è identificabile.</li>
        </ul>
        <p>Non usiamo i tuoi dati per pubblicità, profilazione commerciale o decisioni automatizzate, e non li vendiamo a nessuno.</p>
      </section>

      <section>
        <h2>4. Cosa vedono gli altri utenti</h2>
        <p>
          Nickname, immagine profilo, grado, numero di follower e i tuoi commenti sono visibili agli altri utenti.
          Chi ti segue vede anche le tue maratone, i titoli che stai guardando (senza sapere a che punto sei) e i preferiti.
          Email, nome, cognome e voti personali non sono mai mostrati agli altri utenti.
        </p>
      </section>

      <section>
        <h2>5. Servizi esterni che usiamo</h2>
        <p>Per funzionare MARVEList si appoggia ad alcuni fornitori, che trattano i dati per nostro conto o ricevono solo quanto necessario:</p>
        <ul>
          <li><strong>Vercel</strong> (pubblicazione del sito) e <strong>Render</strong> (server dell'applicazione).</li>
          <li><strong>Neon</strong> (database in cui sono salvati account e attività).</li>
          <li><strong>Google</strong> (invio delle email di servizio tramite Gmail e caratteri tipografici di Google Fonts).</li>
          <li><strong>TMDB</strong> (The Movie Database: locandine, trame, cast e piattaforme di visione fornite da JustWatch) e <strong>YouTube</strong> (trailer): il tuo browser li contatta direttamente per mostrare immagini e video.</li>
          <li><strong>OpenRouter</strong> (intelligenza artificiale di J.A.I.R.V.I.S.): riceve solo il testo della domanda, senza i tuoi dati personali.</li>
          <li><strong>Klipy</strong> (ricerca delle GIF nei commenti): riceve solo le parole che cerchi.</li>
        </ul>
        <p>
          Alcuni di questi fornitori possono trattare dati anche fuori dall'Unione Europea; in questi casi il trasferimento
          avviene con le garanzie previste dal GDPR, come le clausole contrattuali standard approvate dalla Commissione Europea.
        </p>
      </section>

      <section>
        <h2>6. Cookie e memoria del dispositivo</h2>
        <p>
          MARVEList non usa cookie di profilazione o pubblicitari. Nella memoria del browser salva solo quanto serve al
          funzionamento: la sessione di accesso, alcune preferenze (per esempio i filtri e le sezioni aperte) e i file
          dell'app installabile. YouTube può impostare propri cookie quando guardi un trailer.
        </p>
      </section>

      <section>
        <h2>7. Per quanto tempo conserviamo i dati</h2>
        <p>
          I dati dell'account e l'attività restano finché l'account esiste. Se elimini l'account vengono cancellati subito
          e in modo definitivo, compresi commenti, maratone e nickname usati; le eventuali copie di sicurezza dei fornitori
          vengono sovrascritte nei normali tempi tecnici. Gli account registrati ma mai confermati possono essere cancellati.
          I dati tecnici registrati dai server sono conservati per pochi giorni.
        </p>
      </section>

      <section>
        <h2>8. I tuoi diritti</h2>
        <p>
          Puoi chiedere in qualsiasi momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento,
          opporti al trattamento basato sul legittimo interesse e ricevere una copia dei tuoi dati in un formato leggibile
          (portabilità). Molte di queste azioni puoi farle da solo in <strong>Area Personale → Modifica profilo</strong>:
          cambiare nickname e password, scaricare tutti i tuoi dati in formato JSON ed eliminare l'account.
          Per tutto il resto scrivi a {mail}: ti risponderemo entro 30 giorni.
        </p>
        <p>
          Se ritieni che il trattamento dei tuoi dati violi la normativa, puoi presentare reclamo al Garante per la protezione
          dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).
        </p>
      </section>

      <section>
        <h2>9. Minori</h2>
        <p>
          Per registrarti a MARVEList devi avere almeno 14 anni. Se hai meno di 14 anni puoi usare il servizio solo con il
          consenso di chi esercita la responsabilità genitoriale.
        </p>
      </section>

      <section>
        <h2>10. Modifiche a questa informativa</h2>
        <p>
          Se l'informativa cambia in modo rilevante, te lo chiederemo di nuovo al primo accesso successivo: potrai leggere
          la nuova versione e accettarla prima di continuare a usare l'app.
        </p>
      </section>

      {mustAccept ? (
        <div className="privacy-accept">
          {error && <div className="form-error" role="alert">{error}</div>}
          <button type="button" className="btn-marvel" onClick={accept} disabled={saving}>
            {saving ? 'Salvataggio...' : "Ho letto e accetto l'informativa"}
          </button>
        </div>
      ) : (
        <p className="privacy-back"><Link to="/">Torna alla home</Link></p>
      )}
    </div>
  );
};

export default Privacy;
