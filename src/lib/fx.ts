/** Hearts + paper confetti burst. Skipped for people who prefer reduced motion. */
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; heart: boolean; life: number }[] = [];
let raf = 0;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#F0478E', '#FFB3D1', '#B9A4FF', '#6A4FD6', '#FFD3E5', '#E6DEFF'];

export function burst(x: number, y: number, count = 34) {
  if (reduced()) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 7;
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4.5,
      s: 7 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
      c: COLORS[i % COLORS.length], heart: Math.random() < 0.55, life: 0,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

export function burstAt(el: Element | null, count?: number) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, count);
}

function heart(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(0, s * 0.3);
  c.bezierCurveTo(0, 0, -s * 0.5, 0, -s * 0.5, s * 0.3);
  c.bezierCurveTo(-s * 0.5, s * 0.6, 0, s * 0.8, 0, s);
  c.bezierCurveTo(0, s * 0.8, s * 0.5, s * 0.6, s * 0.5, s * 0.3);
  c.bezierCurveTo(s * 0.5, 0, 0, 0, 0, s * 0.3);
  c.fill();
}

function tick() {
  const c = ctx!;
  c.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life < 100 && p.y < innerHeight + 40);
  for (const p of parts) {
    p.life++; p.vy += 0.2; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
    c.save();
    c.globalAlpha = Math.max(0, 1 - p.life / 100);
    c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c;
    if (p.heart) { c.translate(0, -p.s / 2); heart(c, p.s); } else c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    c.restore();
  }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
  if (!raf) c.clearRect(0, 0, innerWidth, innerHeight);
}
