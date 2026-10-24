import type { ReactNode } from 'react';

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

const BULLET = /^\s*[-*+•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const RULE = /^\s*([-*_])\s*(\1\s*){2,}$/;

// Grassetto, corsivo, codice e link: tutto il resto resta testo
const INLINE = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)(?<!\s)\3|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

const renderInline = (text: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const key = `${i}-${m[0].length}`;
    if (m[2]) out.push(<strong key={key}>{renderInline(m[2])}</strong>);
    else if (m[4]) out.push(<em key={key}>{renderInline(m[4])}</em>);
    else if (m[5]) out.push(<code key={key}>{m[5]}</code>);
    else out.push(<a key={key} href={m[7]} target="_blank" rel="noopener noreferrer">{m[6]}</a>);
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  const push = (kind: 'ul' | 'ol', item: string) => {
    const prev = blocks[blocks.length - 1];
    if (prev?.kind === kind) prev.items.push(item);
    else blocks.push({ kind, items: [item] });
  };

  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const prev = blocks[blocks.length - 1];
    let m: RegExpMatchArray | null;

    if (!line.trim() || RULE.test(line)) {
      if (prev) blocks.push({ kind: 'p', lines: [] });
    } else if ((m = line.match(HEADING))) {
      blocks.push({ kind: 'h', text: m[1] });
    } else if ((m = line.match(BULLET))) {
      push('ul', m[1]);
    } else if ((m = line.match(NUMBERED))) {
      push('ol', m[1]);
    } else if (prev?.kind === 'p') {
      prev.lines.push(line.trim());
    } else if ((prev?.kind === 'ul' || prev?.kind === 'ol') && /^\s+/.test(raw)) {
      // Riga a capo dentro una voce dell'elenco
      prev.items[prev.items.length - 1] += ' ' + line.trim();
    } else {
      blocks.push({ kind: 'p', lines: [line.trim()] });
    }
  }
  return blocks.filter(b => b.kind !== 'p' || b.lines.length > 0);
};

// Risposte con testo formattato
const JairvisMessage = ({ text }: { text: string }) => (
  <div className="jv-rich">
    {parseBlocks(text).map((block, i) => {
      if (block.kind === 'h') return <p key={i} className="jv-rich-title">{renderInline(block.text)}</p>;
      if (block.kind === 'p') {
        return (
          <p key={i}>
            {block.lines.map((line, j) => <span key={j}>{j > 0 && <br />}{renderInline(line)}</span>)}
          </p>
        );
      }
      const List = block.kind;
      return <List key={i}>{block.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</List>;
    })}
  </div>
);

export default JairvisMessage;
