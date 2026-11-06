import type { Category, Item, Status, Who } from './types';

export const CATS: Record<Category, { label: string; bg: string; ink: string }> = {
  travel:    { label: 'Travel',    bg: '#DEDAFF', ink: '#3D2FA0' },
  food:      { label: 'Food',      bg: '#FFD9E7', ink: '#A3134F' },
  adventure: { label: 'Adventure', bg: '#DCE6FF', ink: '#23408E' },
  cozy:      { label: 'Cozy',      bg: '#FFE4DA', ink: '#93371B' },
  fun:       { label: 'Fun',       bg: '#FAD4F4', ink: '#8A1A82' },
  creative:  { label: 'Creative',  bg: '#EEDDFF', ink: '#6A22A6' },
};
export const CAT_KEYS = Object.keys(CATS) as Category[];

export const STATUS: Record<Status, { label: string; hint: string }> = {
  boarding:  { label: 'BOARDING',  hint: 'Up next, actually planning it' },
  scheduled: { label: 'ON TIME',   hint: 'On the list, no date yet' },
  delayed:   { label: 'DELAYED',   hint: 'Pushed back for now' },
  departed:  { label: 'DEPARTED',  hint: 'Done together' },
};
export const STATUS_ORDER: Status[] = ['boarding', 'scheduled', 'delayed', 'departed'];

export const INK: Record<Who, string> = { a: '#6A4FD6', b: '#E23C82' };

export const pad = (n: number) => String(n).padStart(2, '0');
export const code = (gate: number) => `BKT-${String(gate).padStart(3, '0')}`;

export const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
};
export const fmtLong = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** stable pseudo-random number in [min, max) per seed */
export const rnd = (seed: string, min: number, max: number) => min + (hash(seed) % 1000) / 1000 * (max - min);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export const initial = (name: string) => (name.trim()[0] || '?').toUpperCase();

export const mrz = (item: Item, names: { a: string; b: string }) => {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '<');
  return `P<BKT${clean(names.a)}<<${clean(names.b)}<<${clean(item.title)}<<${String(item.gate).padStart(3, '0')}`.padEnd(64, '<');
};

export const isDone = (i: Item) => i.status === 'departed';
