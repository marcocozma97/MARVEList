import { useEffect, useRef, useState } from 'react';

// Minigioco 8-bit per l'attesa: Iron Man corre sui tetti, salta da un palazzo all'altro
// ed evita i droni e i loro laser. Si gioca con spazio/freccia su oppure toccando lo schermo.

const W = 320;
const H = 140;
const GRAVITY = 980;
const JUMP_V = -280;
const JUMP_CUT = -110;
const PLAYER_X = 46;
const START_SPEED = 110;
const MAX_SPEED = 235;
const BEST_KEY = 'marvelist:iron-runner-best';

const COLORS: Record<string, string> = {
  R: '#d62828', D: '#8f1414', G: '#f6bd3c', C: '#aef6ff',
  S: '#9aa4b8', K: '#4b5468', E: '#ff3b5c', P: '#cfd6e4',
};

const HEAD = [
  '...RRRR...',
  '..RRRRRR..',
  '..RGGGGR..',
  '..GCGGCG..',
  '..RGGGGR..',
  '...RRRR...',
  '.RRRRRRRR.',
  'RRRRCCRRRR',
  'RG.RRRR.GR',
  'G..RGGR..G',
];
const LEGS = {
  runA: ['...RR.RR..', '..RR...RR.', '..RR...RR.', '.DD.....DD'],
  runB: ['...RRRR...', '...RR.RR..', '...RR.RR..', '...DD.DD..'],
  air: ['...RR.RR..', '...RR.RR..', '...RR.RR..', '...DD.DD..'],
};
const DRONE = [
  'PPP...PPP',
  '.K.....K.',
  '.SSSSSSS.',
  'SSKEEEKSS',
  '..SSSSS..',
];

interface Building { x: number; w: number; top: number; seed: number }
interface Drone { x: number; y: number; charge: number; fired: boolean }
interface Laser { x: number; y: number; vx: number; vy: number }

type Phase = 'ready' | 'run' | 'over';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const readBest = () => {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
};

const drawSprite = (ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, override?: string) => {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      ctx.fillStyle = override ?? COLORS[ch];
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
    }
  });
};

const IronRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const pressRef = useRef<() => void>(() => {});
  const releaseRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>('ready');
  const [best, setBest] = useState(readBest);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const stars = Array.from({ length: 34 }, () => ({ x: Math.floor(rand(0, W)), y: Math.floor(rand(0, 70)), bright: Math.random() < 0.3 }));
    const skyline = (() => {
      const parts: { x: number; w: number; h: number }[] = [];
      for (let x = 0; x < W * 2;) {
        const w = Math.floor(rand(12, 30));
        parts.push({ x, w, h: Math.floor(rand(22, 58)) });
        x += w + Math.floor(rand(0, 4));
      }
      return { parts, width: parts[parts.length - 1].x + parts[parts.length - 1].w };
    })();

    let state: Phase = 'ready';
    let buildings: Building[] = [];
    let drones: Drone[] = [];
    let lasers: Laser[] = [];
    let speed = START_SPEED;
    let distance = 0;
    let skyOffset = 0;
    let y = 110;
    let vy = 0;
    let grounded = true;
    let coyote = 0;
    let jumpBuffer = 0;
    let holding = false;
    let droneTimer = 3;
    let runClock = 0;
    let overAt = 0;
    let frame = 0;
    let last = performance.now();

    const reset = () => {
      buildings = [{ x: -10, w: W + 60, top: 110, seed: 1 }];
      drones = [];
      lasers = [];
      speed = START_SPEED;
      distance = 0;
      y = 110;
      vy = 0;
      grounded = true;
      droneTimer = 3;
      runClock = 0;
      if (scoreRef.current) scoreRef.current.textContent = '00000';
    };

    const addBuildings = () => {
      let lastB = buildings[buildings.length - 1];
      while (lastB.x + lastB.w < W + 80) {
        const maxGap = Math.min(50, 22 + (speed - START_SPEED) * 0.22);
        const gap = rand(16, maxGap);
        const top = Math.max(84, Math.min(122, lastB.top + Math.round(rand(-14, 14))));
        lastB = { x: lastB.x + lastB.w + gap, w: Math.round(rand(46, 120)), top, seed: Math.floor(Math.random() * 1e6) };
        buildings.push(lastB);
      }
    };

    const gameOver = () => {
      state = 'over';
      overAt = performance.now();
      const score = Math.floor(distance / 8);
      setPhase('over');
      setBest(prev => {
        if (score <= prev) return prev;
        try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* memoria non disponibile */ }
        return score;
      });
    };

    pressRef.current = () => {
      holding = true;
      if (state === 'ready') {
        reset();
        state = 'run';
        setPhase('run');
        jumpBuffer = 0.12;
        return;
      }
      if (state === 'over') {
        if (performance.now() - overAt < 450) return;
        reset();
        state = 'run';
        setPhase('run');
        return;
      }
      jumpBuffer = 0.12;
    };
    releaseRef.current = () => {
      holding = false;
      if (vy < JUMP_CUT) vy = JUMP_CUT;
    };

    const update = (dt: number) => {
      runClock += dt;
      speed = Math.min(MAX_SPEED, speed + dt * 3.2);
      const dx = speed * dt;
      distance += dx;
      skyOffset = (skyOffset + dx * 0.3) % skyline.width;
      buildings.forEach(b => { b.x -= dx; });
      buildings = buildings.filter(b => b.x + b.w > -20);
      addBuildings();

      // Salto: un piccolo margine prima dell'atterraggio e dopo il bordo del tetto rende i comandi più morbidi
      jumpBuffer = Math.max(0, jumpBuffer - dt);
      coyote = grounded ? 0.08 : Math.max(0, coyote - dt);
      if (jumpBuffer > 0 && (grounded || coyote > 0)) {
        vy = JUMP_V;
        grounded = false;
        coyote = 0;
        jumpBuffer = 0;
      }
      if (!holding && vy < JUMP_CUT) vy = JUMP_CUT;

      const prevY = y;
      vy += GRAVITY * dt;
      y += vy * dt;
      grounded = false;
      const left = PLAYER_X + 2;
      const right = PLAYER_X + 8;
      for (const b of buildings) {
        if (right <= b.x || left >= b.x + b.w) continue;
        if (vy >= 0 && prevY <= b.top + 0.5 && y >= b.top) {
          y = b.top;
          vy = 0;
          grounded = true;
        } else if (y > b.top + 2) {
          gameOver();
          return;
        }
      }
      if (y > H + 16) { gameOver(); return; }

      // Droni: arrivano da destra, l'occhio lampeggia e poi sparano un laser verso Iron Man
      droneTimer -= dt;
      if (runClock > 4 && droneTimer <= 0) {
        drones.push({ x: W + 8, y: Math.round(rand(26, 60)), charge: 0, fired: false });
        droneTimer = rand(2.4, 4.6) * (START_SPEED / speed) + 0.8;
      }
      const targetX = PLAYER_X + 5;
      const targetY = y - 7;
      drones.forEach(d => {
        d.x -= dx + 22 * dt;
        if (!d.fired && d.x < W - 30 && d.x > PLAYER_X + 70) {
          d.charge += dt;
          if (d.charge > 0.42) {
            d.fired = true;
            const ox = d.x + 4, oy = d.y + 5;
            const len = Math.hypot(targetX - ox, targetY - oy) || 1;
            const v = 150 + speed * 0.35;
            lasers.push({ x: ox, y: oy, vx: ((targetX - ox) / len) * v, vy: ((targetY - oy) / len) * v });
          }
        }
      });
      drones = drones.filter(d => d.x > -16);
      lasers.forEach(l => { l.x += l.vx * dt; l.y += l.vy * dt; });
      lasers = lasers.filter(l => l.x > -10 && l.y < H + 10 && l.y > -10);

      const top = y - 13;
      const hit = (px: number, py: number) => px >= left && px <= right && py >= top && py <= y;
      if (lasers.some(l => hit(l.x, l.y) || hit(l.x - l.vx * 0.025, l.y - l.vy * 0.025))) { gameOver(); return; }
      if (drones.some(d => d.x < right && d.x + 9 > left && d.y < y && d.y + 5 > top)) { gameOver(); return; }

      if (scoreRef.current) scoreRef.current.textContent = String(Math.floor(distance / 8)).padStart(5, '0');
    };

    const draw = () => {
      ctx.fillStyle = '#0a0f1f';
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.fillStyle = s.bright && frame % 90 < 70 ? '#c8d3ff' : '#4a5478';
        ctx.fillRect(s.x, s.y, 1, 1);
      });

      ctx.fillStyle = '#161e36';
      for (const offset of [0, skyline.width]) {
        skyline.parts.forEach(p => {
          const x = Math.round(p.x + offset - skyOffset);
          if (x > W || x + p.w < 0) return;
          ctx.fillRect(x, H - p.h - 20, p.w, p.h + 20);
        });
      }

      buildings.forEach(b => {
        const x = Math.round(b.x);
        ctx.fillStyle = '#26304d';
        ctx.fillRect(x, b.top, Math.round(b.w), H - b.top);
        ctx.fillStyle = '#5b6890';
        ctx.fillRect(x, b.top, Math.round(b.w), 1);
        for (let wy = b.top + 5; wy < H - 2; wy += 7) {
          for (let wx = 4; wx < b.w - 4; wx += 6) {
            const lit = ((b.seed + wx * 7 + wy * 13) % 5) === 0;
            ctx.fillStyle = lit ? '#f6bd3c' : '#333d5e';
            ctx.fillRect(x + wx, wy, 2, 3);
          }
        }
      });

      drones.forEach(d => {
        const blinking = d.charge > 0 && !d.fired && frame % 6 < 3;
        drawSprite(ctx, DRONE, d.x, d.y);
        if (blinking) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(d.x) + 3, Math.round(d.y) + 3, 3, 1); }
        if (frame % 4 < 2) { ctx.fillStyle = '#4b5468'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 9, 1); }
      });

      ctx.fillStyle = '#ff3b5c';
      lasers.forEach(l => {
        const len = Math.hypot(l.vx, l.vy) || 1;
        for (let k = 0; k < 7; k++) {
          ctx.fillRect(Math.round(l.x - (l.vx / len) * k), Math.round(l.y - (l.vy / len) * k), 1, 1);
        }
      });

      const crashed = state === 'over';
      if (!crashed || frame % 10 < 6) {
        const sy = Math.round(y) - 14;
        const legs = !grounded ? LEGS.air : (state === 'run' && Math.floor(distance / 9) % 2 ? LEGS.runA : LEGS.runB);
        drawSprite(ctx, HEAD, PLAYER_X, sy, crashed ? '#e6e6e6' : undefined);
        drawSprite(ctx, legs, PLAYER_X, sy + 10, crashed ? '#e6e6e6' : undefined);
        // Propulsori nei piedi quando vola
        if (!grounded && !crashed) {
          const flick = frame % 4 < 2;
          ctx.fillStyle = '#fff3b0';
          ctx.fillRect(PLAYER_X + 3, sy + 14, 2, 1);
          ctx.fillRect(PLAYER_X + 6, sy + 14, 2, 1);
          ctx.fillStyle = flick ? '#ff9f1c' : '#ffd166';
          ctx.fillRect(PLAYER_X + 3, sy + 15, 2, flick ? 2 : 1);
          ctx.fillRect(PLAYER_X + 6, sy + 15, 2, flick ? 1 : 2);
        }
      }
    };

    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame++;
      if (state === 'run') update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    reset();
    raf = requestAnimationFrame(loop);

    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const onKeyDown = (e: KeyboardEvent) => {
      if (!['Space', 'ArrowUp', 'KeyW'].includes(e.code) || isTyping(e.target)) return;
      e.preventDefault();
      if (!e.repeat) pressRef.current();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) releaseRef.current();
    };
    const onVisibility = () => { last = performance.now(); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      className="iron-runner"
      onPointerDown={(e) => { e.preventDefault(); pressRef.current(); }}
      onPointerUp={() => releaseRef.current()}
      onPointerCancel={() => releaseRef.current()}
      onPointerLeave={() => releaseRef.current()}
    >
      <canvas ref={canvasRef} width={W} height={H} className="iron-runner-canvas" role="img" aria-label="Minigioco: Iron Man salta tra i palazzi evitando i droni" />
      <div className="iron-runner-hud" aria-hidden="true">
        <span>HI {String(best).padStart(5, '0')}</span>
        <span ref={scoreRef}>00000</span>
      </div>
      {phase !== 'run' && (
        <div className="iron-runner-message">
          {phase === 'ready'
            ? <><strong>Tocca o premi spazio</strong><span>Salta tra i palazzi ed evita i laser dei droni</span></>
            : <><strong>Armatura a terra!</strong><span>Tocca o premi spazio per riprovare</span></>}
        </div>
      )}
    </div>
  );
};

export default IronRunner;
