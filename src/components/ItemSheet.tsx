import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { Item, Status } from '../lib/types';
import { CATS, CAT_KEYS, INK, STATUS, STATUS_ORDER, code, fmtLong, fmtShort, initial, pad, rnd } from '../lib/meta';
import { useItemBits, useStore } from '../lib/store';
import { burstAt } from '../lib/fx';
import { Barcode, Modal, PhotoInput, Stamp } from './bits';
import { CameraIcon, CatIcon, HeartIcon, SendIcon, TrashIcon, XIcon } from './icons';

export function ItemSheet() {
  const { data, openId, open } = useStore();
  const item = data?.items.find(i => i.id === openId);
  if (!item) return null;
  return (
    <Modal onClose={() => open(null)} label={item.title} className="pass-wrap">
      <Pass key={item.id} item={item} />
    </Modal>
  );
}

function Pass({ item }: { item: Item }) {
  const { data, open, actions, me, setLightbox, uploading } = useStore();
  const { notes, photos } = useItemBits(item.id);
  const names = data!.names;
  const cat = CATS[item.category];
  const done = item.status === 'departed';

  const [title, setTitle] = useState(item.title);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [slam, setSlam] = useState(false);
  const [armed, setArmed] = useState(false);
  const [freshNote, setFreshNote] = useState<string | null>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(notes.length);

  useEffect(() => setTitle(item.title), [item.title]);
  useEffect(() => {
    if (notes.length > prevCount.current) {
      setFreshNote(notes[notes.length - 1].id);
      notesRef.current?.scrollTo({ top: notesRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevCount.current = notes.length;
  }, [notes]);
  useEffect(() => { notesRef.current?.scrollTo({ top: notesRef.current.scrollHeight }); }, []);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  const setStatus = (s: Status) => {
    if (s === item.status) return;
    if (s === 'departed') {
      actions.update(item.id, { status: s, done_at: item.done_at || new Date().toISOString(), scratched: true });
      setSlam(true);
      window.setTimeout(() => burstAt(stampRef.current, 46), 260);
    } else {
      actions.update(item.id, { status: s, done_at: null, scratched: false, rating: 0 });
    }
  };

  const saveTitle = () => {
    const v = title.trim();
    if (v && v !== item.title) actions.update(item.id, { title: v });
    else setTitle(item.title);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) { setErr('Write something first.'); return; }
    if (!me) { setErr('Pick who you are at the top first.'); return; }
    const ok = await actions.addNote(item.id, v);
    if (ok) setDraft('');
  };

  const heart = (e: React.MouseEvent) => {
    if (!me) { setErr('Pick who you are at the top first.'); return; }
    const on = !item.hearts[me];
    actions.update(item.id, { hearts: { ...item.hearts, [me]: on } });
    if (on) burstAt(e.currentTarget, 14);
  };

  const rate = (n: number, el: HTMLElement) => {
    actions.update(item.id, { rating: n });
    if (n === 5) burstAt(el, 20);
  };

  return (
    <div className={`pass${done ? ' is-done' : ''}`} style={{ '--cat': cat.ink, '--cat-bg': cat.bg } as CSSProperties}>
      <button className="pass-x" onClick={() => open(null)} aria-label="Close"><XIcon /></button>

      <div className="pass-main">
        <div className="pass-top mono">
          <span>BOARDING PASS · {code(item.gate)}</span>
          <span>ISSUED {fmtShort(item.created_at)} BY {names[item.created_by].toUpperCase()}</span>
        </div>

        <label className="sr-only" htmlFor="pass-title">Title</label>
        <input id="pass-title" className="pass-title" value={title} maxLength={120}
          onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />

        <div className="pass-cats" role="radiogroup" aria-label="Category">
          {CAT_KEYS.map(k => (
            <button key={k} role="radio" aria-checked={item.category === k}
              className={`cat-pill${item.category === k ? ' on' : ''}`}
              style={{ '--cat': CATS[k].ink, '--cat-bg': CATS[k].bg } as CSSProperties}
              onClick={() => actions.update(item.id, { category: k })}>
              <CatIcon cat={k} size={14} />{CATS[k].label}
            </button>
          ))}
        </div>

        <div className="pass-section">
          <span className="mono tiny">STATUS</span>
          <div className="status-flaps" role="radiogroup" aria-label="Status">
            {STATUS_ORDER.map(s => (
              <button key={s} role="radio" aria-checked={item.status === s} title={STATUS[s].hint}
                className={`sflap sflap-${s}${item.status === s ? ' on' : ''}`} onClick={() => setStatus(s)}>
                {STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="pass-row">
          <button className={`heart-btn${me && item.hearts[me] ? ' on' : ''}`} onClick={heart}
            style={{ '--ink': INK[me || 'a'] } as CSSProperties} aria-pressed={!!(me && item.hearts[me])}>
            <HeartIcon filled={!!(me && item.hearts[me])} />
            {me && item.hearts[me] ? 'You want this' : 'I want this too'}
          </button>
          {item.hearts.a && item.hearts.b && <span className="both serif">you both want this</span>}
          {done && (
            <div className="rate" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} role="radio" aria-checked={item.rating === n} aria-label={`${n} stars`}
                  className={n <= item.rating ? 'on' : ''} onClick={e => rate(n, e.currentTarget)}>★</button>
              ))}
            </div>
          )}
        </div>

        {done && (
          <div className="pass-section">
            <span className="mono tiny">PHOTOS FROM THE DAY · {photos.length}</span>
            <div className="pass-photos">
              {photos.map((p, i) => (
                <div key={p.id} className="pphoto" style={{ '--r': `${rnd(p.id, -3, 3)}deg` } as CSSProperties}>
                  <button onClick={() => setLightbox({ photos, index: i })} aria-label="View photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </button>
                  <button className="pphoto-x" onClick={() => actions.removePhoto(p)} aria-label="Remove photo"><XIcon size={12} /></button>
                </div>
              ))}
              {Array.from({ length: uploading[item.id] || 0 }).map((_, i) => <div key={`l${i}`} className="pphoto loading" />)}
              <PhotoInput className="pphoto add" onFiles={f => actions.addPhotos(item.id, f)}>
                <CameraIcon size={22} /><span className="mono tiny">ADD</span>
              </PhotoInput>
            </div>
          </div>
        )}

        <div className="pass-section notes-sec">
          <span className="mono tiny">LETTERS · {notes.length}</span>
          <div className="notes" ref={notesRef}>
            {notes.length === 0 && <p className="note-empty serif">no letters yet. say something sweet</p>}
            {notes.map(n => (
              <p key={n.id} className={`note${n.id === freshNote ? ' fresh' : ''}`} style={{ color: INK[n.author] }}>
                <span className="note-who mono" style={{ background: INK[n.author] }}>{initial(names[n.author])}</span>
                <span className="note-body serif">{n.body}</span>
                <time className="mono">{fmtShort(n.created_at)}</time>
              </p>
            ))}
          </div>
          <form className="say" onSubmit={submit} style={{ '--ink': INK[me || 'a'] } as CSSProperties}>
            <label className="sr-only" htmlFor="note-in">Your note</label>
            <textarea id="note-in" rows={1} value={draft} maxLength={600}
              placeholder={me ? `write as ${names[me]}…` : 'pick who you are first…'}
              onChange={e => { setDraft(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
            <button type="submit" aria-label="Send note"><SendIcon /></button>
          </form>
          {err && <p className="err">{err}</p>}
        </div>

        <div className="pass-foot">
          <button className={`del${armed ? ' armed' : ''}`} onClick={() => {
            if (!armed) { setArmed(true); return; }
            actions.remove(item); open(null);
          }}>
            <TrashIcon />{armed ? 'Tap again to tear it up' : 'Remove'}
          </button>
          {done && item.done_at && <span className="mono tiny">DEPARTED {fmtLong(item.done_at)}</span>}
        </div>
      </div>

      <div className="pass-stub">
        <span className="mono tiny">GATE</span>
        <span className="gate big">{pad(item.gate)}</span>
        <span className="pass-icon"><CatIcon cat={item.category} size={34} /></span>
        <div className="stub-people">
          {(['a', 'b'] as const).map(w => (
            <span key={w} className={`pax${item.hearts[w] ? ' on' : ''}`} style={{ '--ink': INK[w] } as CSSProperties}>
              {initial(names[w])}
            </span>
          ))}
        </div>
        <Barcode seed={item.id} className="vertical" />
        {done && (
          <div ref={stampRef} className="pass-stamp-anchor">
            <Stamp top="ADMITTED" main="DONE" bottom={item.done_at ? fmtShort(item.done_at) : ''} slam={slam}
              tone={item.gate % 2 ? 'pink' : 'lav'} rotate={rnd(item.id, -20, -8)} />
          </div>
        )}
      </div>
    </div>
  );
}
