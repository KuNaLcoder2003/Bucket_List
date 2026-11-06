import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Item, Photo } from '../lib/types';
import { CATS, INK, code, rnd } from '../lib/meta';
import { useStore } from '../lib/store';
import { burst } from '../lib/fx';
import { CatIcon, HeartIcon } from './icons';
import { Stars } from './bits';

/* What sits under the foil, and what a finished polaroid shows */
function Picture({ item, photo }: { item: Item; photo?: Photo }) {
  const cat = CATS[item.category];
  if (photo) return <img className="pic-img" src={photo.url} alt="" loading="lazy" />;
  return (
    <div className="pic-blank" style={{ background: cat.bg, color: cat.ink }}>
      <CatIcon cat={item.category} size={44} />
    </div>
  );
}

export function Polaroid({ item, photo, index }: { item: Item; photo?: Photo; index: number }) {
  const { open, data } = useStore();
  const tape = index % 2 ? 'var(--lav)' : 'var(--pink-2)';
  return (
    <button className="polaroid" data-item={item.id} onClick={() => open(item.id)}
      style={{ '--r': `${rnd(item.id, -5, 5)}deg`, '--dy': `${rnd(item.id + 'y', -10, 14)}px`, '--i': index, '--tape': tape } as CSSProperties}>
      <span className="tape" aria-hidden="true" />
      <span className="pol-photo"><Picture item={item} photo={photo} /></span>
      <span className="pol-cap serif">{item.title}</span>
      <span className="pol-foot">
        <Stars n={item.rating} size={12} />
        <span className="pol-hearts">
          {item.hearts.a && <span style={{ color: INK.a }}><HeartIcon filled size={11} /></span>}
          {item.hearts.b && <span style={{ color: INK.b }}><HeartIcon filled size={11} /></span>}
        </span>
      </span>
      <span className="sr-only">{data?.names.a} and {data?.names.b} did this</span>
    </button>
  );
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function drawFoil(ctx: CanvasRenderingContext2D, w: number, h: number, item: Item) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#D9CCFF'); g.addColorStop(0.45, '#C3B0FF'); g.addColorStop(0.55, '#E9E1FF'); g.addColorStop(1, '#BBA6FA');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5;
  for (let x = -h; x < w + h; x += 13) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 26; i++) {
    const x = rnd(item.id + 'sx' + i, 0, w), y = rnd(item.id + 'sy' + i, 0, h), s = rnd(item.id + 'ss' + i, 0.8, 2.4);
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#3D2A86';
  ctx.font = '500 10px "DM Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`${code(item.gate)} · ${CATS[item.category].label.toUpperCase()}`, 12, 12);
  const size = w < 170 ? 17 : 21;
  ctx.font = `800 ${size}px "Bricolage Grotesque", sans-serif`;
  const lines = wrapLines(ctx, item.title.toUpperCase(), w - 24);
  const lh = size * 1.02;
  const top = h / 2 - (lines.length * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 12, top + i * lh));
  ctx.font = '400 9.5px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(61,42,134,.75)';
  ctx.fillText('SCRATCH WHEN YOU’VE DONE IT', 12, h - 22);
}

export function ScratchTile({ item, photo, index }: { item: Item; photo?: Photo; index: number }) {
  const { open, actions, toast } = useStore();
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ down: false, last: null as null | { x: number; y: number }, moved: 0, strokes: 0, done: false });
  const [gone, setGone] = useState(false);
  const [rubbing, setRubbing] = useState(false);

  const paint = useCallback(() => {
    const c = cv.current, el = wrap.current;
    if (!c || !el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFoil(ctx, r.width, r.height, item);
  }, [item]);

  useEffect(() => {
    paint();
    const ro = new ResizeObserver(() => { if (!st.current.strokes) paint(); });
    if (wrap.current) ro.observe(wrap.current);
    document.fonts?.ready.then(() => { if (!st.current.strokes) paint(); });
    return () => ro.disconnect();
  }, [paint]);

  const pos = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const progress = () => {
    const c = cv.current!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let clear = 0, total = 0;
    for (let i = 3; i < d.length; i += 4 * 37) { total++; if (d[i] < 50) clear++; }
    return total ? clear / total : 0;
  };

  const finish = () => {
    if (st.current.done) return;
    st.current.done = true;
    setGone(true);
    const r = wrap.current!.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 44);
    window.setTimeout(() => {
      actions.update(item.id, { status: 'departed', scratched: true, done_at: item.done_at || new Date().toISOString() });
      toast(`${item.title}: done! Add your photos to it.`);
    }, 650);
  };

  const onDown = (e: React.PointerEvent) => {
    st.current.down = true; st.current.last = pos(e); st.current.moved = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.down || s.done) return;
    const p = pos(e);
    const l = s.last || p;
    s.moved += Math.hypot(p.x - l.x, p.y - l.y);
    if (s.moved < 6) return;
    if (!rubbing) setRubbing(true);
    const ctx = cv.current!.getContext('2d')!;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    s.last = p; s.strokes++;
    if (s.strokes % 6 === 0 && progress() > 0.52) finish();
  };
  const onUp = () => {
    const s = st.current;
    s.down = false; setRubbing(false);
    if (s.moved < 6 && !s.done) open(item.id);
  };

  return (
    <div ref={wrap} className={`scratch${gone ? ' gone' : ''}${rubbing ? ' rubbing' : ''}`} data-item={item.id}
      style={{ '--r': `${rnd(item.id, -2.5, 2.5)}deg`, '--dy': `${rnd(item.id + 'y', -10, 14)}px`, '--i': index } as CSSProperties}>
      <div className="scratch-under"><Picture item={item} photo={photo} /></div>
      <canvas ref={cv} className="scratch-foil" aria-label={`${item.title}. Rub to scratch off when done, tap to open.`}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') open(item.id); }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { st.current.down = false; setRubbing(false); }} />
      {(item.hearts.a || item.hearts.b) && (
        <span className="scratch-hearts" aria-hidden="true">
          {item.hearts.a && <span style={{ color: INK.a }}><HeartIcon filled size={11} /></span>}
          {item.hearts.b && <span style={{ color: INK.b }}><HeartIcon filled size={11} /></span>}
        </span>
      )}
    </div>
  );
}
