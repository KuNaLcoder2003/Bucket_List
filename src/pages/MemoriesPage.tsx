import type { CSSProperties } from 'react';
import type { Item } from '../lib/types';
import { CATS, fmtLong, mrz, pad, rnd, hash } from '../lib/meta';
import { useItemBits, useStore } from '../lib/store';
import { PhotoInput, Stamp, Stars, Zine } from '../components/bits';
import { CameraIcon } from '../components/icons';
import { NavLink } from 'react-router-dom';

export function MemoriesPage() {
  const { data } = useStore();
  const done = data!.items.filter(i => i.status === 'departed')
    .sort((a, b) => (b.done_at || '').localeCompare(a.done_at || ''));
  const photoCount = data!.photos.filter(p => done.some(d => d.id === p.item_id)).length;
  const best = [...done].sort((a, b) => b.rating - a.rating)[0];

  return (
    <main className="page">
      <Zine kicker={`HOLDERS · ${data!.names.a.toUpperCase()} & ${data!.names.b.toUpperCase()}`} a="Our" b="passport"
        right={
          <dl className="pp-stats mono">
            <div><dt>STAMPS</dt><dd>{pad(done.length)}</dd></div>
            <div><dt>PHOTOS</dt><dd>{pad(photoCount)}</dd></div>
            {best && best.rating > 0 && <div className="wide"><dt>BEST SO FAR</dt><dd className="serif">{best.title}</dd></div>}
          </dl>
        } />

      {done.length === 0 ? (
        <div className="empty">
          <p className="serif">No stamps yet. Go do something from the list, then mark it departed.</p>
          <NavLink className="btn-ink" to="/">Open the list</NavLink>
        </div>
      ) : (
        <div className="passport">
          {done.map((it, i) => <PassportPage key={it.id} item={it} entry={done.length - i} index={i} />)}
        </div>
      )}
    </main>
  );
}

const SHAPES = ['circle', 'rect', 'double'] as const;

/** first words that fit a stamp (≤ 14 chars), never cut mid-word */
function shortTitle(t: string) {
  let out = '';
  for (const w of t.split(/\s+/)) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > 14) break;
    out = next;
  }
  return out || t.slice(0, 12);
}

function PassportPage({ item, entry, index }: { item: Item; entry: number; index: number }) {
  const { data, open, actions, setLightbox, uploading } = useStore();
  const { photos, notes } = useItemBits(item.id);
  const cat = CATS[item.category];
  const shape = SHAPES[hash(item.id) % 3];
  const tone = index % 2 ? 'lav' : 'pink';
  const busy = uploading[item.id] || 0;
  const lastNote = notes[notes.length - 1];

  return (
    <article className="pp" style={{ '--i': index, '--cat': cat.ink, '--cat-bg': cat.bg } as CSSProperties}>
      <div className="pp-head mono">
        <span>ENTRY {pad(entry)} · {cat.label.toUpperCase()}</span>
        <span>{item.done_at ? fmtLong(item.done_at) : ''}</span>
      </div>

      <div className="pp-body">
        <div className="pp-photos">
          {photos.slice(0, 3).map((p, j) => (
            <button key={p.id} className={`taped t${j}`} onClick={() => setLightbox({ photos, index: j })}
              style={{ '--r': `${rnd(p.id, -7, 7)}deg` } as CSSProperties} aria-label="View photo">
              <span className="tape" aria-hidden="true" />
              <img src={p.url} alt="" loading="lazy" />
            </button>
          ))}
          {Array.from({ length: busy }).map((_, j) => <span key={`b${j}`} className="taped loading" />)}
          {photos.length === 0 && !busy && (
            <PhotoInput className="taped empty" onFiles={f => actions.addPhotos(item.id, f)}>
              <CameraIcon size={26} />
              <span className="serif">tape in your first photo</span>
            </PhotoInput>
          )}
          {photos.length > 3 && (
            <button className="pp-more mono" onClick={() => setLightbox({ photos, index: 3 })}>+{photos.length - 3} MORE</button>
          )}
        </div>
        <Stamp className="pp-stamp" shape={shape} tone={tone} rotate={rnd(item.id, -22, 14)}
          top={cat.label.toUpperCase()} main={shortTitle(item.title)}
          bottom={item.done_at ? fmtLong(item.done_at).replace(/ \d{4}$/, '') : ''} />
      </div>

      <div className="pp-foot">
        <button className="pp-title serif" onClick={() => open(item.id)}>{item.title}</button>
        <div className="pp-actions">
          <Stars n={item.rating} />
          {photos.length > 0 && (
            <PhotoInput className="mini-btn mono" onFiles={f => actions.addPhotos(item.id, f)}>
              <CameraIcon size={14} />ADD
            </PhotoInput>
          )}
        </div>
      </div>
      {lastNote && <p className="pp-note serif" style={{ color: lastNote.author === 'a' ? 'var(--ink-a)' : 'var(--ink-b)' }}>“{lastNote.body}”</p>}
      <p className="mrz mono" aria-hidden="true">{mrz(item, data!.names)}</p>
    </article>
  );
}
