import { useEffect, useRef } from 'react';

interface NeuralGlobeProps {
  size: number;          // lato in px del canvas
  bootDuration?: number; // ms in cui i collegamenti si accendono progressivamente
  active?: boolean;      // J.A.I.R.V.I.S. sta "pensando": rotazione e impulsi più intensi
  className?: string;
}

interface Node3D { x: number; y: number; z: number; delay: number }
interface Pulse { link: number; t: number; speed: number }

const NODE_COUNT = 150;
const LINK_DISTANCE = 0.42; // distanza massima (sfera di raggio 1) per collegare due nodi

// Globo di "neuroni": collegamenti compaiono durante l'avvio e degli impulsi luminosi viaggiano lungo le sinapsi.
const NeuralGlobe = ({ size, bootDuration = 3000, active = false, className = '' }: NeuralGlobeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Nodi sulla sfera
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nodes: Node3D[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, delay: Math.random() };
    });

    // Collegamenti tra nodi vicini (il ritardo decide quando si accendono durante l'avvio)
    const links: [number, number, number][] = [];
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
        if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) links.push([a, b, Math.random()]);
      }
    }

    const pulses: Pulse[] = [];
    const start = performance.now();
    let angle = 0;
    let last = start;
    let frame = 0;

    const draw = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const isActive = activeRef.current;
      const boot = reduceMotion ? 1 : Math.min((now - start) / bootDuration, 1);
      const eased = 1 - Math.pow(1 - boot, 3);

      angle += dt * (isActive ? 0.0009 : 0.00035) * (reduceMotion ? 0 : 1);
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const tilt = 0.35, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const radius = size * 0.4 * (0.85 + 0.15 * eased);
      const cx = size / 2, cy = size / 2;

      // Proiezione: rotazione su Y, inclinazione su X, prospettiva leggera
      const projected = nodes.map(n => {
        const x1 = n.x * cosA - n.z * sinA;
        const z1 = n.x * sinA + n.z * cosA;
        const y1 = n.y * cosT - z1 * sinT;
        const z2 = n.y * sinT + z1 * cosT;
        const scale = 1 / (1.9 - z2 * 0.6);
        return { x: cx + x1 * radius * scale * 1.45, y: cy + y1 * radius * scale * 1.45, depth: (z2 + 1) / 2 };
      });

      ctx.clearRect(0, 0, size, size);

      // Alone centrale
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.25);
      halo.addColorStop(0, `rgba(56, 189, 248, ${0.16 + (isActive ? 0.1 : 0) + 0.04 * Math.sin(now / 600)})`);
      halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Sinapsi
      ctx.lineWidth = 1;
      links.forEach(([a, b, delay]) => {
        if (delay > eased) return;
        const pa = projected[a], pb = projected[b];
        const depth = (pa.depth + pb.depth) / 2;
        const fadeIn = Math.min((eased - delay) * 6, 1);
        ctx.strokeStyle = `rgba(100, 255, 218, ${(0.05 + depth * 0.32) * fadeIn})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });

      // Nuovi impulsi lungo collegamenti già accesi
      const spawnRate = isActive ? 0.55 : 0.18;
      if (!reduceMotion && Math.random() < spawnRate && pulses.length < 40) {
        const link = Math.floor(Math.random() * links.length);
        if (links[link][2] <= eased) pulses.push({ link, t: 0, speed: 0.0008 + Math.random() * 0.0012 });
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed * dt * (isActive ? 1.8 : 1);
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const [a, b] = links[p.link];
        const pa = projected[a], pb = projected[b];
        const x = pa.x + (pb.x - pa.x) * p.t, y = pa.y + (pb.y - pa.y) * p.t;
        const depth = pa.depth + (pb.depth - pa.depth) * p.t;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 6);
        glow.addColorStop(0, `rgba(224, 255, 250, ${0.4 + depth * 0.6})`);
        glow.addColorStop(1, 'rgba(100, 255, 218, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Neuroni (dietro più piccoli e tenui, davanti più grandi e luminosi)
      projected.forEach((p, i) => {
        const appear = Math.min(Math.max((eased * 1.4 - nodes[i].delay * 0.4) * 2, 0), 1);
        if (!appear) return;
        const r = (0.8 + p.depth * 1.8) * appear;
        ctx.fillStyle = `rgba(${p.depth > 0.6 ? '224, 255, 250' : '56, 189, 248'}, ${(0.25 + p.depth * 0.75) * appear})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [size, bootDuration]);

  return <canvas ref={canvasRef} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
};

export default NeuralGlobe;
