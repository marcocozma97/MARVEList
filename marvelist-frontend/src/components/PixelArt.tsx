import { memo } from 'react';

// Disegno a pixel in SVG: ogni carattere della griglia è un pixel ('.' = trasparente) e la palette ne dà il colore.
// I pixel uguali vicini sulla stessa riga diventano un solo rettangolo; con crispEdges restano nitidi a ogni dimensione.
interface PixelGridProps {
  rows: string[];
  palette: Record<string, string>;
  x?: number;
  y?: number;
  className?: string;
  // Classi CSS per alcuni colori (es. le gemme che brillano)
  classes?: Record<string, string>;
}

export const PixelGrid = memo(({ rows, palette, x = 0, y = 0, className, classes = {} }: PixelGridProps) => {
  const rects: React.ReactElement[] = [];
  rows.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let len = 1;
      while (i + len < row.length && row[i + len] === ch) len++;
      if (palette[ch]) {
        rects.push(<rect key={`${j}-${i}`} x={x + i} y={y + j} width={len} height={1} fill={palette[ch]} className={classes[ch]} />);
      }
      i += len;
    }
  });
  return <g className={className}>{rects}</g>;
});
PixelGrid.displayName = 'PixelGrid';
