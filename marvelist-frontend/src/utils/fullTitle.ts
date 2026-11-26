export const showFullTitle = (e: React.MouseEvent<HTMLElement>) => {
  const card = e.currentTarget;
  const text = card.querySelector<HTMLElement>('[data-clamp]');
  if (!text) return;
  const cut = text.scrollHeight > text.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1;
  if (cut) card.title = text.textContent ?? '';
  else card.removeAttribute('title');
};
