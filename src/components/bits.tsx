import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { hash } from '../lib/meta';

/* ── Riso zine header ── */
export function Zine({ a, b, kicker, right }: { a: string; b: string; kicker: string; right?: ReactNode }) {
  return (
    <header className="zine">
      <div className="riso" aria-hidden="true"><span className="blob pink" /><span className="blob lav" /></div>
      <p className="kicker mono">{kicker}</p>
      <div className="zine-row">
        <h1 className="zine-title"><span>{a}</span><em>{b}</em></h1>
        {right}
      </div>
    </header>
  );
}

/* ── Split-flap counter ── */
function Flap({ ch, delay }: { ch: string; delay: number }) {
  const digit = /\d/.test(ch);
  const [shown, setShown] = useState(digit ? '0' : ch);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!digit || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(ch); return; }
    let n = 0;
    let t: number;
    const total = 7 + delay * 2;
    const step = () => {
      n++;
      setTick(x => x + 1);
      if (n >= total) { setShown(ch); return; }
      setShown(String(Math.floor(Math.random() * 10)));
      t = window.setTimeout(step, 60);
    };
    t = window.setTimeout(step, 120 + delay * 40);
    return () => window.clearTimeout(t);
  }, [ch, delay, digit]);
  if (!digit) return <span className="flap-sep">{ch}</span>;
  return <span className="flap"><span key={tick} className="flap-in">{shown}</span></span>;
}

export function FlipCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="flip">
      <span className="mono tiny">{label}</span>
      <div className="flip-row" aria-label={`${label} ${value}`}>
        {value.split('').map((c, i) => <Flap key={i} ch={c} delay={i} />)}
      </div>
    </div>
  );
}

/* ── Ink stamp ── */
export function Stamp({ top, main, bottom, tone = 'pink', shape = 'circle', rotate = -12, slam, style, className }: {
  top?: string; main: string; bottom?: string; tone?: 'pink' | 'lav';
  shape?: 'circle' | 'rect' | 'double'; rotate?: number; slam?: boolean; style?: CSSProperties; className?: string;
}) {
  return (
    <div className={`stamp stamp-${shape} stamp-${tone}${slam ? ' slam' : ''} ${className || ''}`}
      style={{ ...style, ['--rot' as string]: `${rotate}deg` }} aria-hidden="true">
      {top && <span className="mono">{top}</span>}
      <strong>{main}</strong>
      {bottom && <span className="mono">{bottom}</span>}
    </div>
  );
}

/* ── Barcode from a seed ── */
export function Barcode({ seed, className }: { seed: string; className?: string }) {
  const h = hash(seed);
  const bars = Array.from({ length: 26 }, (_, i) => ((h >> (i % 28)) & 3) + 1);
  return (
    <span className={`barcode ${className || ''}`} aria-hidden="true">
      {bars.map((w, i) => <i key={i} style={{ width: w, opacity: i % 2 ? 0 : 1 }} />)}
    </span>
  );
}

/* ── Stars ── */
export function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${n} of 5`}>
      {'★'.repeat(n)}<span className="stars-off">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

/* ── Modal shell ── */
export function Modal({ onClose, label, className, children }: {
  onClose: () => void; label: string; className?: string; children: ReactNode;
}) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, []);
  return createPortal(
    <div className="ov" role="dialog" aria-modal="true" aria-label={label}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={className}>{children}</div>
    </div>,
    document.body,
  );
}

/* ── Hidden file input wrapped in a label ── */
export function PhotoInput({ onFiles, className, children, title }: {
  onFiles: (f: FileList) => void; className?: string; children: ReactNode; title?: string;
}) {
  return (
    <label className={className} title={title} onClick={e => e.stopPropagation()}>
      {children}
      <input type="file" accept="image/*" multiple hidden
        onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }} />
    </label>
  );
}
