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
      item('Serve un account?',
        <>Sì: Timeline, Road To, maratone e J.A.I.R.V.I.S. sono legati al tuo profilo, così ritrovi visti, voti e progressi su qualsiasi dispositivo. <Link to="/register">Registrati</Link> in pochi secondi: è gratis.</>),
      item("Come posso segnalare un problema o proporre un'idea?",
        <>Scrivici a <a href="mailto:marvelist.app@gmail.com">marvelist.app@gmail.com</a>: segnalazioni di errori, idee su cosa aggiungere, titoli mancanti o qualsiasi altra cosa. Leggiamo tutto!</>),
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
        <>Nell'ordine di uscita dentro ogni fase, con i One-Shot subito dopo il film a cui sono legati.</>),
    ],
  },
  {
    id: 'progressi', title: 'Schede e progressi', items: [
      item('Come segno quanto ho visto di un film?',
        <>Nella scheda del film sposta lo slider (o scrivi i minuti) e premi <strong>Salva</strong>. Il film compare in "Continua a guardare" nel profilo; quando arrivi alla durata completa diventa visto da solo.</>),
      item('E per le serie TV?',
        <>Nella scheda tocca i numeri degli episodi visti. Il pulsante <strong>ALL</strong> li segna tutti; premendolo di nuovo tornano tutti non visti. Con l'ultimo episodio la stagione risulta vista.</>),
      item('Cos\'è "Continua a guardare"?',
        <>È la watchlist automatica del profilo: contiene i film iniziati e le serie con almeno un episodio visto, ma non ancora finiti. Non serve aggiungere nulla a mano.</>),
      item('Cosa fa il pulsante "Guarda dopo"?',
        <>Nella scheda di un film o di una serie, sotto la locandina, ti permette di rimandare quel titolo: la locandina prende un bordo giallo e il titolo viene saltato. Nella barra della fase (e nelle percentuali delle Road To) conta come fatto, con un tratto giallo: se manca solo lui la fase risulta completata. Nelle maratone esce dal calendario e dal totale. Non conta invece per il grado del profilo: per diventare <strong>Eroe</strong> devi vedere davvero tutto l'MCU. Premendolo di nuovo il titolo torna normale ovunque.</>),
      item('Cosa indica la barra sottile sotto le locandine?',
        <>Quanto hai visto di quel titolo: i minuti sulla durata per i film, gli episodi visti sul totale per le serie.</>),
      item('Come funziona il voto a scudi?',
        <>Dai da 1 a 10 scudi di Capitan America: la metà sinistra di uno scudo vale mezzo voto. Ricliccando il voto dato lo togli. I voti restano salvati anche se segni il titolo come non visto.</>),
      item("Perché alcune locandine hanno un simbolo invece dell'immagine?",
        <>Se un titolo non ha ancora una locandina ufficiale ne mostriamo una provvisoria: prima cerchiamo un'immagine, altrimenti compare un simbolo legato al personaggio. Viene sostituita in automatico appena esce quella vera. Se manca la trama trovi "Trama non trovata".</>),
    ],
  },
  {
    id: 'gradi', title: 'Profilo e gradi', items: [
      item('Come funziona il badge del grado?',
        <>Cresce con quello che hai completato: da <strong>Recluta S.H.I.E.L.D.</strong> fino a <strong>GOD OF MARVEL</strong>, passando per i gradi MCU (rossi), Marvel Fan (gialli) e Marvel GOD (celesti). Nel profilo passa il mouse sul badge, o toccalo, per vedere tutti i gradi e i loro colori.</>),
      item('I titoli non ancora usciti contano?',
        <>No: i titoli "in arrivo" non contano come mancanti. Quando escono entrano nel conteggio e il grado si aggiorna da solo.</>),
      item('Posso cambiare nickname e immagine profilo?',
        <>Sì, nel profilo. Il nickname lo scegli al primo accesso e poi puoi cambiarlo con la matita accanto al nome <strong>una volta ogni 30 giorni</strong>: quando è di nuovo possibile ti arriva una notifica. L'immagine invece la cambi quando vuoi toccando l'avatar.</>),
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
      item('Come seguo un altro utente?',
        <>Tocca il nome o l'avatar di chi ha scritto un commento, oppure usa <strong>Trova utenti</strong> nel tuo profilo, e premi <strong>Segui</strong>. Nel suo profilo vedi i preferiti e le maratone pubbliche: "Continua a guardare", visti e progressi restano privati.</>),
      item('Posso mettere mi piace e rispondere ai commenti?',
        <>Sì: sotto ogni commento trovi il cuore e <strong>Rispondi</strong>. Le risposte compaiono sotto il commento e possono essere segnate come spoiler.</>),
      item('Dove vedo le notifiche?',
        <>Nella campanella in alto, accanto al profilo: ti avvisa quando qualcuno inizia a seguirti, mette mi piace a un tuo commento o ti risponde, quando arriva un nuovo titolo nel catalogo e quando ne esce uno. Per i titoli con una data di uscita ti ricorda anche un mese, una settimana e un giorno prima.</>),
      item('Le mie maratone sono visibili agli altri?',
        <>Solo se lo scegli tu: quando crei o modifichi una maratona puoi impostarla come <strong>Privata</strong> (la vedi solo tu) o <strong>Pubblica</strong> (gli altri vedono nome e titoli, non i tuoi progressi).</>),
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
    ],
  },
];

// Tutte le FAQ in testo semplice, calcolate una volta all'avvio dell'app: J.A.I.R.V.I.S. le riceve con ogni domanda
export const FAQ_KNOWLEDGE = FAQ_SECTIONS
  .map(section => `## ${section.title}\n` + section.items
    .map(it => `D: ${it.q}\nR: ${nodeText(it.a).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()}`)
    .join('\n\n'))
  .join('\n\n');
