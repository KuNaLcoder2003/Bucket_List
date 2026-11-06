import type { CSSProperties } from 'react';
import type { Item } from '../lib/types';
import { CATS, INK, STATUS, code, fmtShort, initial, pad, rnd } from '../lib/meta';
import { useItemBits, useStore } from '../lib/store';
import { Barcode, PhotoInput, Stamp } from './bits';
import { CameraIcon, CatIcon, HeartIcon } from './icons';

export function Ticket({ item, index }: { item: Item; index: number }) {
  const { data, open, actions, uploading, setLightbox, freshId } = useStore();
  const { notes, photos } = useItemBits(item.id);
  const names = data!.names;
  const cat = CATS[item.category];
  const done = item.status === 'departed';
  const busy = uploading[item.id] || 0;

  return (
    <article
      className={`ticket${done ? ' is-done' : ''}${freshId === item.id ? ' is-fresh' : ''}`}
      style={{ '--i': index, '--cat': cat.ink, '--cat-bg': cat.bg } as CSSProperties}
      role="button" tabIndex={0} aria-label={`Open ${item.title}`} data-item={item.id}
      onClick={() => open(item.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item.id); } }}
    >
      <div className="ticket-main">
        <div className="ticket-meta mono">
          <span className="ticket-code"><CatIcon cat={item.category} size={13} /> {code(item.gate)} · {cat.label.toUpperCase()}</span>
          <span className={`chip chip-${item.status}`}>
            {STATUS[item.status].label}{done && item.done_at ? ` ${fmtShort(item.done_at)}` : ''}
          </span>
        </div>
        <h3 className="ticket-title">{item.title}</h3>

        {!done && (
          notes.length ? (
            <p className="ticket-notes">
              {notes.slice(-2).map(n => (
                <span key={n.id} style={{ color: INK[n.author] }}>
                  “{n.body}” <small className="mono">{initial(names[n.author])}</small>
                </span>
              ))}
            </p>
          ) : <p className="ticket-notes muted">no notes yet. tap to write the first one</p>
        )}

        {done && (
          <div className="thumbs">
            {photos.slice(0, 4).map((p, i) => (
              <button key={p.id} className="thumb" style={{ '--r': `${rnd(p.id, -4, 4)}deg` } as CSSProperties}
                onClick={e => { e.stopPropagation(); setLightbox({ photos, index: i }); }} aria-label="View photo">
                <img src={p.url} alt="" loading="lazy" />
              </button>
            ))}
            {photos.length > 4 && <span className="thumb more mono">+{photos.length - 4}</span>}
            {Array.from({ length: busy }).map((_, i) => <span key={`u${i}`} className="thumb loading" />)}
            <PhotoInput className="thumb add" title="Add photos" onFiles={f => actions.addPhotos(item.id, f)}>
              <CameraIcon size={18} />
            </PhotoInput>
          </div>
        )}

        {done && (
          <Stamp className="ticket-stamp" top="ADMITTED" main="DONE" bottom={item.rating ? '★'.repeat(item.rating) : item.done_at ? fmtShort(item.done_at) : ''}
            tone={item.gate % 2 ? 'pink' : 'lav'} rotate={rnd(item.id, -18, -6)} />
        )}
      </div>

      <div className="ticket-stub">
        <span className="mono tiny">GATE</span>
        <span className="gate">{pad(item.gate)}</span>
        <span className="stub-hearts">
          {item.hearts.a && <span style={{ color: INK.a }} title={`${names.a} wants this`}><HeartIcon filled size={13} /></span>}
          {item.hearts.b && <span style={{ color: INK.b }} title={`${names.b} wants this`}><HeartIcon filled size={13} /></span>}
        </span>
        <Barcode seed={item.id} />
      </div>
    </article>
  );
}
