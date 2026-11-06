import { useMemo, useState, type CSSProperties } from 'react';
import type { Category, Item, Who } from '../lib/types';
import { CATS, CAT_KEYS, INK, STATUS_ORDER, pad } from '../lib/meta';
import { useStore } from '../lib/store';
import { FlipCounter, Zine } from '../components/bits';
import { Ticket } from '../components/Ticket';
import { HeartIcon, PlusIcon } from '../components/icons';

type Filter = 'all' | 'next' | 'done' | Category;

export function ListPage() {
  const { data, setAddOpen } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const items = data!.items;
  const done = items.filter(i => i.status === 'departed').length;

  const { upcoming, departed } = useMemo(() => {
    const f = items.filter(i =>
      filter === 'all' ? true : filter === 'next' ? i.status !== 'departed' : filter === 'done' ? i.status === 'departed' : i.category === filter);
    return {
      upcoming: f.filter(i => i.status !== 'departed')
        .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.gate - b.gate),
      departed: f.filter(i => i.status === 'departed')
        .sort((a, b) => (b.done_at || '').localeCompare(a.done_at || '')),
    };
  }, [items, filter]);

  const tabs: [Filter, string][] = [['all', 'ALL'], ['next', 'UP NEXT'], ['done', 'DEPARTED'], ...CAT_KEYS.map(k => [k, CATS[k].label.toUpperCase()] as [Filter, string])];

  return (
    <main className="page">
      <Zine kicker={`${items.length} TICKETS ISSUED · ${items.length - done} STILL TO GO`} a="Bucket" b="list"
        right={<FlipCounter label="DONE / TOTAL" value={`${pad(done)}/${pad(items.length)}`} />} />

      <section className="manifest" aria-label="Passengers">
        {(['a', 'b'] as Who[]).map(w => <Passenger key={w} who={w} items={items} />)}
      </section>

      <nav className="tabs mono" aria-label="Filter">
        {tabs.map(([k, l]) => (
          <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </nav>

      {upcoming.length > 0 && (
        <section className="sect">
          <SectHead kicker="NOW BOARDING" title={`${upcoming.length} still to go`} big={pad(upcoming.length)} tone="pink" />
          <div className="tickets">
            {upcoming.map((it, i) => <Ticket key={it.id} item={it} index={i} />)}
            <button className="ticket-new" onClick={() => setAddOpen(true)}>
              <PlusIcon /><span>Print a new ticket</span>
            </button>
          </div>
        </section>
      )}

      {departed.length > 0 && (
        <section className="sect">
          <SectHead kicker="DEPARTED" title={`${departed.length} ${departed.length === 1 ? 'memory' : 'memories'} made`} big={pad(departed.length)} tone="lav" />
          <div className="tickets">
            {departed.map((it, i) => <Ticket key={it.id} item={it} index={i} />)}
          </div>
        </section>
      )}

      {upcoming.length === 0 && departed.length === 0 && (
        <div className="empty">
          <p className="serif">Nothing on this gate yet.</p>
          <button className="btn-ink" onClick={() => setAddOpen(true)}><PlusIcon />Print a new ticket</button>
        </div>
      )}
    </main>
  );
}

function SectHead({ kicker, title, big, tone }: { kicker: string; title: string; big: string; tone: 'pink' | 'lav' }) {
  return (
    <div className="sect-head">
      <div>
        <p className={`mono tiny ${tone}`}>{kicker}</p>
        <h2 className="serif sect-title">{title}</h2>
      </div>
      <span className="sect-big" aria-hidden="true">{big}</span>
    </div>
  );
}

function Passenger({ who, items }: { who: Who; items: Item[] }) {
  const { data, me } = useStore();
  const name = data!.names[who];
  const mine = items.filter(i => i.created_by === who);
  const doneMine = mine.filter(i => i.status === 'departed').length;
  const loved = items.filter(i => i.hearts[who]).length;
  const fav = items.filter(i => i.hearts[who] && i.status !== 'departed').sort((a, b) => a.gate - b.gate)[0];
  return (
    <article className={`pax-card${me === who ? ' is-me' : ''}`} style={{ '--ink': INK[who] } as CSSProperties}>
      <div className="pax-top">
        <span className="mono tiny">PASSENGER {who === 'a' ? '01' : '02'}{me === who ? ' · YOU' : ''}</span>
        <span className="pax-ink" aria-hidden="true" />
      </div>
      <h3 className="serif pax-name">{name}</h3>
      <dl className="pax-stats mono">
        <div><dt>PICKED</dt><dd>{pad(mine.length)}</dd></div>
        <div><dt>DONE</dt><dd>{pad(doneMine)}</dd></div>
        <div><dt><HeartIcon filled size={10} /></dt><dd>{pad(loved)}</dd></div>
      </dl>
      {fav && <p className="pax-fav"><span className="mono tiny">DREAMING OF</span> <span className="serif">{fav.title}</span></p>}
    </article>
  );
}
