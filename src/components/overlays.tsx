import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import type { Category, Who } from '../lib/types';
import { CATS, CAT_KEYS, INK, initial } from '../lib/meta';
import { useStore } from '../lib/store';
import { burst } from '../lib/fx';
import { Modal } from './bits';
import { ArrowIcon, CatIcon, PlusIcon, XIcon } from './icons';

export function AddIdea() {
  const { addOpen, setAddOpen, actions } = useStore();
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<Category>('travel');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!addOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = title.trim();
    if (!v) { setErr('Give it a name first.'); return; }
    setBusy(true);
    const item = await actions.addItem(v, cat);
    setBusy(false);
    if (item) {
      setTitle(''); setAddOpen(false);
      window.setTimeout(() => {
        const el = document.querySelector(`[data-item="${item.id}"]`) || document.querySelector('.is-fresh');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const r = el.getBoundingClientRect();
          window.setTimeout(() => burst(r.left + r.width / 2, r.top + 30, 26), 450);
        }
      }, 80);
    }
  };

  return (
    <Modal onClose={() => setAddOpen(false)} label="New idea" className="dlg">
      <form onSubmit={submit}>
        <button type="button" className="dlg-x" onClick={() => setAddOpen(false)} aria-label="Close"><XIcon /></button>
        <p className="mono tiny pink">NEW TICKET</p>
        <h2 className="dlg-title">Print a new <em>ticket</em></h2>
        <label className="field-label" htmlFor="new-title">Where are we going?</label>
        <input id="new-title" className="big-input" autoFocus maxLength={120} value={title}
          placeholder="Dance class on a rooftop" onChange={e => { setTitle(e.target.value); setErr(''); }} />
        {err && <p className="err">{err}</p>}
        <span className="field-label">What kind of trip is it?</span>
        <div className="cat-grid" role="radiogroup" aria-label="Category">
          {CAT_KEYS.map(k => (
            <button type="button" key={k} role="radio" aria-checked={cat === k}
              className={`cat-tile${cat === k ? ' on' : ''}`}
              style={{ '--cat': CATS[k].ink, '--cat-bg': CATS[k].bg } as CSSProperties}
              onClick={() => setCat(k)}>
              <CatIcon cat={k} size={22} /><span>{CATS[k].label}</span>
            </button>
          ))}
        </div>
        <button className="btn-ink wide" type="submit" disabled={busy}>
          <PlusIcon />{busy ? 'Printing…' : 'Print ticket'}
        </button>
      </form>
    </Modal>
  );
}

export function WhoAmI() {
  const { me, setMe, data } = useStore();
  if (me || !data) return null;
  return (
    <Modal onClose={() => setMe('a')} label="Who's this?" className="dlg">
      <p className="mono tiny pink">PASSENGER CHECK-IN</p>
      <h2 className="dlg-title">Who's <em>holding</em> the phone?</h2>
      <p className="dlg-sub">Your letters get your own ink. This device will remember.</p>
      <div className="whos">
        {(['a', 'b'] as Who[]).map(w => (
          <button key={w} className="who-card" style={{ '--ink': INK[w] } as CSSProperties} onClick={() => setMe(w)}>
            <span className="who-init">{initial(data.names[w])}</span>
            <span className="who-name serif">{data.names[w]}</span>
            <span className="mono tiny">{w === 'a' ? 'LAVENDER INK' : 'PINK INK'}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function NamesDialog() {
  const { namesOpen, setNamesOpen, data, actions, toast } = useStore();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (namesOpen && data) { setA(data.names.a); setB(data.names.b); } }, [namesOpen, data]);
  if (!namesOpen) return null;
  return (
    <Modal onClose={() => setNamesOpen(false)} label="Your names" className="dlg">
      <form onSubmit={e => {
        e.preventDefault();
        if (!a.trim() || !b.trim()) { setErr('Both names need at least one letter.'); return; }
        actions.setNames({ a: a.trim(), b: b.trim() }); setNamesOpen(false); toast('Names saved');
      }}>
        <button type="button" className="dlg-x" onClick={() => setNamesOpen(false)} aria-label="Close"><XIcon /></button>
        <p className="mono tiny pink">PASSENGERS</p>
        <h2 className="dlg-title">Your <em>names</em></h2>
        <div className="names-grid">
          <div>
            <label className="field-label" htmlFor="na" style={{ color: INK.a }}>Lavender ink</label>
            <input id="na" className="big-input" maxLength={24} value={a} onChange={e => { setA(e.target.value); setErr(''); }} />
          </div>
          <div>
            <label className="field-label" htmlFor="nb" style={{ color: INK.b }}>Pink ink</label>
            <input id="nb" className="big-input" maxLength={24} value={b} onChange={e => { setB(e.target.value); setErr(''); }} />
          </div>
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn-ink wide" type="submit">Save names</button>
      </form>
    </Modal>
  );
}

export function Lightbox() {
  const { lightbox, setLightbox, data } = useStore();
  const [i, setI] = useState(0);
  useEffect(() => { if (lightbox) setI(lightbox.index); }, [lightbox]);
  useEffect(() => {
    if (!lightbox) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI(x => (x + 1) % lightbox.photos.length);
      if (e.key === 'ArrowLeft') setI(x => (x - 1 + lightbox.photos.length) % lightbox.photos.length);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [lightbox]);
  if (!lightbox || !lightbox.photos.length) return null;
  const p = lightbox.photos[Math.min(i, lightbox.photos.length - 1)];
  const item = data?.items.find(x => x.id === p.item_id);
  const n = lightbox.photos.length;
  return (
    <Modal onClose={() => setLightbox(null)} label="Photo" className="lb">
      <button className="lb-x" onClick={() => setLightbox(null)} aria-label="Close"><XIcon size={22} /></button>
      <figure className="lb-frame" key={p.id}>
        <img src={p.url} alt={item ? `Photo from ${item.title}` : 'Photo'} />
        <figcaption>
          <span className="serif">{item?.title}</span>
          <span className="mono tiny">{i + 1} / {n} · BY {data?.names[p.uploaded_by].toUpperCase()}</span>
        </figcaption>
      </figure>
      {n > 1 && <>
        <button className="lb-nav left" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous photo"><ArrowIcon dir="left" /></button>
        <button className="lb-nav right" onClick={() => setI((i + 1) % n)} aria-label="Next photo"><ArrowIcon /></button>
      </>}
    </Modal>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}
