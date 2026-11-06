import { useStore } from '../lib/store';
import { Zine } from '../components/bits';
import { Polaroid, ScratchTile } from '../components/Board';
import { PlusIcon } from '../components/icons';

export function PinboardPage() {
  const { data, setAddOpen } = useStore();
  const items = [...data!.items].sort((a, b) => a.gate - b.gate);
  const scratched = items.filter(i => i.status === 'departed' && i.scratched).length;
  const firstPhoto = (id: string) => data!.photos.find(p => p.item_id === id);

  return (
    <main className="page">
      <Zine kicker={`${scratched} SCRATCHED · ${items.length - scratched} STILL UNDER FOIL`} a="The" b="board"
        right={<p className="zine-note serif">Rub a tile once you've done it to reveal your memory. Tap to open it.</p>} />
      <div className="board">
        {items.map((it, i) =>
          it.status === 'departed' && it.scratched
            ? <Polaroid key={it.id} item={it} photo={firstPhoto(it.id)} index={i} />
            : <ScratchTile key={it.id} item={it} photo={firstPhoto(it.id)} index={i} />,
        )}
        <button className="board-add" onClick={() => setAddOpen(true)} style={{ ['--i' as string]: items.length }}>
          <span className="board-add-ring"><PlusIcon size={26} /></span>
          <span className="serif">pin a new one</span>
        </button>
      </div>
    </main>
  );
}
