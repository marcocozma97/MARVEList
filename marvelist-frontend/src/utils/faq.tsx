import { isValidElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface FaqItem { q: string; a: ReactNode }
export interface FaqSection { id: string; title: string; items: FaqItem[] }

const item = (q: string, a: ReactNode): FaqItem => ({ q, a });

// Testo semplice di una risposta: serve alla ricerca nelle FAQ e alla base di conoscenza di J.A.I.R.V.I.S.
export const nodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === 'br') return '\n';
    return nodeText(node.props.children);
  }
  return '';
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'base', title: 'Primi passi', items: [
      item("Cos'è MARVEList?",
        <>È il tuo diario dell'Universo Marvel: segui l'ordine di visione di film e serie TV, segna cosa hai visto, vota i titoli, organizza maratone e chiedi consigli a J.A.I.R.V.I.S.</>),
      item('Devo pagare per usare MARVEList?',
        <>Assolutamente no! Stark Industries finanzia interamente questo progetto.</>),
      item("Posso installare MARVEList sul telefono come un'app?",
        <>Sì, su Android e su iPhone, gratis e senza passare dagli store.<br />
          <strong>Android:</strong> apri il sito con Chrome e, nella home sotto <strong>Esplora la Timeline</strong>, tocca <strong>Installa MARVEList</strong>; se il pulsante non c'è ancora, tocca ⋮ in alto a destra → <strong>Installa app</strong>.<br />
          <strong>iPhone e iPad:</strong> apri il sito con Safari (trovi la guida anche nella home, sotto <strong>Esplora la Timeline</strong>), tocca <strong>Condividi</strong> (il quadrato con la freccia in su) e poi <strong>Aggiungi alla schermata Home</strong>.<br />
          L'app si apre a schermo intero dalla schermata Home e si aggiorna da sola: non devi scaricare niente quando escono novità.</>),
      item('Come vengono usati i miei dati?',
        <>Solo per far funzionare MARVEList: account, progressi, maratone e Community. Niente pubblicità, niente profilazione e i dati non vengono venduti a nessuno. Trovi tutti i dettagli nell'<Link to="/privacy">informativa sulla privacy</Link>, che si accetta alla registrazione; da <strong>Modifica profilo</strong> puoi scaricare i tuoi dati o eliminare l'account quando vuoi.</>),
      item('Serve un account?',
        <>Sì: Timeline, Road To, Community, maratone e J.A.I.R.V.I.S. sono legati al tuo profilo, così ritrovi visti, voti e progressi su qualsiasi dispositivo. <Link to="/register">Registrati</Link> in pochi secondi: è gratis.</>),
      item("Come posso segnalare un problema o proporre un'idea?",
        <>Scrivici a <a href="mailto:marvelist.app@gmail.com">marvelist.app@gmail.com</a>: segnalazioni di errori, idee su cosa aggiungere, titoli mancanti o qualsiasi altra cosa. Leggiamo tutto!</>),
    ],
  },
  {
    id: 'account', title: 'Account e accesso', items: [
      item('Non mi è arrivata la mail di conferma: cosa faccio?',
        <>Controlla anche nella cartella <strong>spam</strong> o "promozioni": il link vale 24 ore. Se non la trovi, <Link to="/register">registrati di nuovo</Link> con la stessa email: ti mandiamo un'altra mail e funziona anche il link di quella precedente. Tra una richiesta e l'altra aspetta un paio di minuti.</>),
      item('Ho confermato la mail ma non riesco ad accedere',
        <>Le maiuscole nell'email non contano, quindi "Mario@gmail.com" e "mario@gmail.com" sono lo stesso account. Se ti sei registrato più volte prima di confermare, vale la password dell'<strong>ultima</strong> registrazione. Se non la ricordi usa <Link to="/forgot-password">Password dimenticata?</Link>.</>),
      item('Ho dimenticato la password',
        <>Nella pagina di accesso tocca <Link to="/forgot-password">Password dimenticata?</Link> e scrivi la tua email: ti arriva un link per sceglierne una nuova. Il link vale 60 minuti e si può usare una sola volta. Dopo il cambio, su tutti gli altri dispositivi dovrai accedere di nuovo.</>),
      item('Come cambio nickname, password o immagine profilo?',
        <>Nell'<Link to="/profile">Area Personale</Link> tocca <strong>Modifica profilo</strong>, accanto a "Trova utenti". Il nickname è unico, resta tuo anche dopo averlo cambiato e si può cambiare <strong>una volta ogni 30 giorni</strong> (quando torna possibile ti arriva una notifica). Per cambiare la password serve quella attuale: chi era collegato con il tuo account da altri dispositivi dovrà accedere di nuovo. L'immagine profilo la cambi quando vuoi toccando l'avatar.</>),
      item('Posso salvare i miei dati o portarli su un nuovo profilo?',
        <>Sì: in <strong>Modifica profilo → I tuoi dati</strong> scarichi un file JSON con visti, episodi, voti, preferiti, "guarda dopo", maratone, utenti seguiti e commenti. Da un nuovo profilo puoi caricare quel file e ritrovare i tuoi progressi (i commenti restano solo nel file).</>),
      item('Cosa succede se elimino il mio account?',
        <>Vengono eliminati <strong>per sempre tutti i tuoi progressi</strong> (visti, voti, preferiti, maratone, follow, notifiche e commenti con le relative risposte) e non è possibile recuperarli. Inoltre <strong>tutti i nickname che hai usato tornano liberi e potranno essere scelti da altri utenti</strong>. Per questo, prima di eliminare l'account, scarica i tuoi dati da <strong>Modifica profilo → I tuoi dati</strong>. L'eliminazione richiede tre passaggi di conferma e la tua password.</>),
    ],
  },
  {
    id: 'timeline', title: 'Timeline', items: [
      item('Quali sono i 3 ordini di visione della Timeline?',
        <><strong>MCU:</strong> solo i film e le serie principali (Sacra Linea Temporale).<br />
          <strong>Marvel Fan:</strong> include i progetti correlati canonizzati dal Multiverso (es. Spider-Man di Tobey/Andrew, Daredevil Netflix).<br />
          <strong>Marvel GOD:</strong> tutto. Qualsiasi cosa abbia il logo Marvel, compresi i vecchi film Fox, le serie ABC e l'animazione.</>),
      item('Come segno un titolo come visto?',
        <>Tocca il cerchio in alto a destra sulla locandina, oppure apri la scheda del titolo e usa il cerchio accanto alla X. Per le serie puoi anche segnare i singoli episodi.</>),
      item("Posso segnare come vista un'intera fase?",
        <>Sì: ogni fase ha un cerchio accanto alla freccia. Cliccandolo segni visti tutti i titoli della fase; cliccandolo di nuovo tornano tutti non visti e i progressi in corso vengono azzerati. Voti e preferiti restano.</>),
      item('In che ordine sono i titoli?',
        <>Nell'ordine di uscita dentro ogni fase, con i One-Shot subito dopo il film a cui sono legati. Nella Timeline <strong>MCU</strong> puoi passare all'<strong>ordine cronologico</strong>: i titoli seguono gli eventi narrati, dal più lontano nel tempo al più recente, divisi per epoca della storia (da "Le origini" alla "Saga del Multiverso"). I titoli ambientati in altri universi, come X-Men '97 o Marvel Zombies, sono raggruppati in fondo.</>),
    ],
  },
  {
    id: 'progressi', title: 'Schede e progressi', items: [
      item("Cos'è il voto MARVEList?",
        <>È la media dei voti dati con gli scudi da tutti gli utenti di MARVEList, da 0,5 a 10. Lo trovi nelle schede di film e serie e nei singoli episodi, accanto al voto TMDB, con il numero di voti tra parentesi. Quando voti, la media si aggiorna subito.</>),
      item('Dove posso vedere un film o una serie in Italia?',
        <>Nella scheda del titolo, sotto la trama, il riquadro <strong>Dove vederlo in Italia</strong> mostra le piattaforme in abbonamento o gratuite e, se c'è, dove noleggiarlo o comprarlo. Toccando una piattaforma apri la pagina con i link diretti. Se non è su nessuna piattaforma compare <strong>Non disponibile in Italia</strong> con la bandiera dell'Hydra. I dati arrivano da JustWatch e si aggiornano da soli; per le serie divise in stagioni valgono le piattaforme della serie intera.</>),
      item('Come segno quanto ho visto di un film?',
        <>Nella scheda del film sposta lo slider (o scrivi i minuti) e premi <strong>Salva</strong>. Il film compare in "Continua a guardare" nel profilo; quando arrivi alla durata completa diventa visto da solo.</>),
      item('E per le serie TV?',
        <>Nella scheda tocca i numeri degli episodi visti. Il pulsante <strong>ALL</strong> li segna tutti; premendolo di nuovo tornano tutti non visti. Con l'ultimo episodio la stagione risulta vista. Se hai visto solo una parte di un episodio, aprilo e segna i minuti visti: nella scheda della serie il suo riquadro si colora di rosso in proporzione a quanto hai visto.</>),
      item('Cos\'è "Continua a guardare"?',
        <>È la watchlist automatica del profilo: contiene i film iniziati e le serie con almeno un episodio visto, ma non ancora finiti. Non serve aggiungere nulla a mano.</>),
      item('Cosa fa il pulsante "Guarda dopo"?',
        <>Nella scheda di un film o di una serie, sotto la locandina, ti permette di rimandare quel titolo: la locandina prende un bordo giallo e il titolo viene saltato. Nella barra della fase (e nelle percentuali delle Road To) conta come fatto, con un tratto giallo: se manca solo lui la fase risulta completata. Nelle maratone esce dal calendario e dal totale. Non conta invece per il grado del profilo: per diventare <strong>Eroe</strong> devi vedere davvero tutto l'MCU. Premendolo di nuovo il titolo torna normale ovunque.</>),
      item('Cosa indica la barra sottile sotto le locandine?',
        <>Quanto hai visto di quel titolo: i minuti sulla durata per i film, gli episodi visti sul totale per le serie.</>),
      item('Come funziona il voto a scudi?',
        <>Dai da 1 a 10 scudi di Capitan America: la metà sinistra di uno scudo vale mezzo voto. Ricliccando il voto dato lo togli. Da smartphone e tablet puoi anche far scorrere il dito sugli scudi: il voto segue il dito, e toccando di nuovo lo scudo del voto lo togli. I voti restano salvati anche se segni il titolo come non visto.</>),
      item('Cos\'è "La tua Top 10" nel profilo?',
        <>Nel profilo, tra "Continua a guardare" e i preferiti, trovi i 10 titoli a cui hai dato il voto più alto, con la posizione scritta in grande sulla locandina come nelle classifiche della Community. Contano tutti i voti che hai già dato a film e serie: una serie (o una stagione) entra solo quando l'hai completata, cioè con tutti gli episodi visti, e le hai dato un voto; i voti ai singoli episodi non contano. Se hai votato meno di 10 titoli, i posti ancora liberi restano vuoti. Se due o più titoli hanno lo stesso voto, accanto al titolo della sezione compare la coppa <strong>🏆</strong>: toccala e scegli tu l'ordine (o, se i posti non bastano, quali restano in classifica). Dopo la conferma la coppa smette di lampeggiare ma resta lì: se cambi idea, toccala e riordina i pari merito quando vuoi. Se voti un nuovo titolo e finisce a pari merito con quelli della tua Top 10, la coppa torna e ricevi una notifica per confermare di nuovo la classifica. Le scelte già fatte restano salvate.</>),
      item("Perché alcune locandine hanno un simbolo invece dell'immagine?",
        <>Se un titolo non ha ancora una locandina ufficiale ne mostriamo una provvisoria: prima cerchiamo un'immagine, altrimenti compare un simbolo legato al personaggio. Viene sostituita in automatico appena esce quella vera. Se manca la trama trovi "Trama non trovata".</>),
    ],
  },
  {
    id: 'gradi', title: 'Gradi', items: [
      item('Come funziona il badge del grado?',
        <>Cresce con quello che hai completato: da <strong>Recluta S.H.I.E.L.D.</strong> fino a <strong>GOD OF MARVEL</strong>, passando per i gradi MCU (rossi), Marvel Fan (gialli) e Marvel GOD (celesti). Nel profilo passa il mouse sul badge, o toccalo, per vedere tutti i gradi e i loro colori.</>),
      item('I titoli non ancora usciti contano?',
        <>No: i titoli "in arrivo" non contano come mancanti. Quando escono entrano nel conteggio e il grado si aggiorna da solo.</>),
    ],
  },
  {
    id: 'maratone', title: 'Maratone', items: [
      item('Come creo una maratona?',
        <>Dal profilo tocca <strong>Crea la tua maratona</strong>: scegli nome, partenza (MCU, Marvel Fan o Marvel GOD), i titoli da togliere, lo sfondo, le date e quanti film a settimana ed episodi al giorno vuoi vedere.</>),
      item('E se non ho abbastanza tempo per vedere tutto?',
        <>Prima di salvare ti avvisiamo e ti proponiamo la data di fine minima: puoi spostarla o aumentare i film a settimana / gli episodi al giorno.</>),
      item('Cosa succede se salto un giorno?',
        <>Quando il giorno finisce, quello che non hai visto viene spostato automaticamente sui giorni successivi: il calendario riparte sempre da oggi.</>),
      item('Spuntare un titolo nella maratona lo segna come visto?',
        <>Sì, risulta visto anche nel profilo e nel calendario resta barrato fino a fine giornata: i contenuti di domani restano a domani. Se hai sbagliato usa "Annulla" o togli la spunta.</>),
    ],
  },
  {
    id: 'social', title: 'Community e amici', items: [
      item('Cosa trovo nella pagina Community?',
        <>Nella <Link to="/community">Community</Link>, accanto a Road To nel menu, trovi:<br />
          <strong>Prossime uscite:</strong> film, serie e nuovi episodi in arrivo, in ordine di data.<br />
          <strong>Usciti da poco:</strong> i titoli dell'ultimo mese e i nuovi episodi delle ultime due settimane.<br />
          <strong>Top 10 visti della settimana:</strong> i titoli che negli ultimi 7 giorni sono stati segnati come visti dal maggior numero di persone (per le serie contano anche i nuovi episodi visti; segnare un'intera fase come vista non conta).<br />
          <strong>Top 10 più votati:</strong> i titoli con il voto MARVEList più alto, tra quelli con almeno 5 voti; a parità di voto passa sopra chi ha ricevuto più voti.<br />
          Le due classifiche si aggiornano ogni 24 ore.</>),
      item('Come seguo un altro utente?',
        <>Tocca il nome o l'avatar di chi ha scritto un commento, oppure usa <strong>Trova utenti</strong> nel tuo profilo, e premi <strong>Segui</strong>. Da quel momento nel suo profilo vedi il grado, tutte le sue maratone, i titoli che sta guardando (senza sapere a che punto è) e i preferiti. Chi segui e chi ti segue lo vede solo il proprietario del profilo.</>),
      item('Posso mettere mi piace e rispondere ai commenti?',
        <>Sì: sotto ogni commento trovi il cuore e <strong>Rispondi</strong>. Le risposte compaiono sotto il commento e possono essere segnate come spoiler.</>),
      item('Dove vedo le notifiche?',
        <>Nella campanella in alto, accanto al profilo: ti avvisa quando qualcuno inizia a seguirti, mette mi piace a un tuo commento o ti risponde, quando arriva un nuovo titolo nel catalogo e quando ne esce uno. Per i titoli con una data di uscita ti ricorda anche un mese, una settimana e un giorno prima.</>),
      item('Le mie maratone sono visibili agli altri?',
        <>Sì, a chi ti segue: vede il nome della maratona e i titoli che contiene, non i tuoi progressi. Chi non ti segue non vede nulla del tuo profilo oltre a nome, immagine e numero di follower.</>),
    ],
  },
  {
    id: 'extra', title: 'Road To, News e J.A.I.R.V.I.S.', items: [
      item('Da dove arrivano le notizie del Daily Bugle?',
        <>Le <Link to="/news">News</Link> raccolgono gli articoli italiani sul mondo Marvel degli ultimi 14 giorni, tramite Google News. Ogni titolo apre l'articolo sul sito della testata; se la notizia parla di un film o di una serie del catalogo trovi anche il link alla sua scheda.</>),
      item('Cosa sono le Road To?',
        <>Percorsi pronti per prepararsi ai grandi eventi: <strong>Road to Doomsday</strong> (Doctor Doom), <strong>Road to Endgame</strong> (Thanos) e <strong>Road to Spiderverse</strong> (Spider-Man). Scegli un personaggio e sotto compaiono i titoli divisi per fase.</>),
      item('Chi è J.A.I.R.V.I.S.?',
        <>È la tua Intelligenza Artificiale personale. Puoi chiedergli curiosità sui fumetti, spiegazioni sulle scene post-credit o consigli su cosa guardare stasera! Lo trovi nel menu in alto dopo l'accesso, oppure in fondo a questa pagina.</>),
      item('Quante domande posso fare a J.A.I.R.V.I.S.?',
        <>J.A.I.R.V.I.S. è la nuova intelligenza sperimentale delle Stark Industries ed è in versione demo: puoi fargli <strong>una domanda ogni 24 ore</strong>, che torna disponibile 24 ore dopo averla fatta. Per i dubbi su come funziona MARVEList guarda prima queste FAQ: così non sprechi la domanda del giorno. Se è in manutenzione, DUM-E e U ci stanno lavorando e tornerà presto.</>),
    ],
  },
];

// Tutte le FAQ in testo semplice, calcolate una volta all'avvio dell'app: J.A.I.R.V.I.S. le riceve con ogni domanda
export const FAQ_KNOWLEDGE = FAQ_SECTIONS
  .map(section => `## ${section.title}\n` + section.items
    .map(it => `D: ${it.q}\nR: ${nodeText(it.a).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()}`)
    .join('\n\n'))
  .join('\n\n');
