import type { Data, Item, Note } from './types';

const day = 86400000;
const now = Date.now();
const ago = (d: number) => new Date(now - d * day).toISOString();

type Row = [string, Item['category'], Item['status'], Item['created_by'], Item['hearts'], number, number?];
const rows: Row[] = [
  ['Stargazing trip to Spiti', 'travel', 'boarding', 'a', { a: true, b: true }, 0],
  ['Make sushi at home', 'food', 'boarding', 'a', { a: true, b: true }, 0],
  ['Pottery class', 'creative', 'scheduled', 'b', { b: true }, 0],
  ['Karaoke night', 'fun', 'delayed', 'b', { b: true }, 0],
  ["Cook each other's favourite dish", 'food', 'scheduled', 'a', { a: true }, 0],
  ['Street food crawl', 'food', 'scheduled', 'a', { a: true }, 0],
  ["Paint each other's portraits", 'creative', 'scheduled', 'b', { b: true }, 0],
  ['Try paragliding', 'adventure', 'scheduled', 'a', { a: true }, 0],
  ['Road trip with no plan', 'travel', 'scheduled', 'b', { a: true, b: true }, 0],
  ['Sunrise hike', 'adventure', 'departed', 'b', { a: true }, 4, 9],
  ['Blanket fort movie marathon', 'cozy', 'departed', 'b', { a: true, b: true }, 5, 11],
  ['Recreate our first date', 'cozy', 'departed', 'a', { a: true, b: true }, 5, 16],
];

export function seedData(): Data {
  const items: Item[] = rows.map(([title, category, status, created_by, hearts, rating, doneAgo], i) => ({
    id: `seed-${i + 1}`,
    gate: i + 1,
    title,
    category,
    status,
    rating,
    created_by,
    hearts,
    created_at: ago(30 - i),
    done_at: doneAgo ? ago(doneAgo) : null,
    scratched: status === 'departed',
  }));
  const n = (item: number, author: 'a' | 'b', body: string, d: number): Note => ({
    id: `seed-n-${item}-${d}`, item_id: `seed-${item}`, author, body, created_at: ago(d),
  });
  const notes: Note[] = [
    n(1, 'a', 'summer 2027, deal?', 6),
    n(1, 'b', 'deal ♡', 5.9),
    n(2, 'a', "I'll get the bamboo mat", 4),
    n(2, 'b', 'rice is mine!!', 3.9),
    n(4, 'b', "you're singing first", 3),
    n(5, 'a', 'biryani incoming', 2),
    n(8, 'b', 'only if you go first', 1),
    n(10, 'a', 'so worth waking up at 4', 9),
    n(10, 'b', 'never again lol', 8.9),
    n(11, 'b', 'best sunday ever', 11),
    n(12, 'a', 'same table and everything', 16),
  ];
  return { items, notes, photos: [], names: { a: 'Kunal', b: 'Meghavi' } };
}
