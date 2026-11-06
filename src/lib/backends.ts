import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend, Data, Item, Names, Note, Photo } from './types';
import { blobToDataURL, compressImage } from './image';
import { seedData } from './seed';
import { uid } from './meta';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function makeBackend(): Backend {
  if (url && key && !url.includes('your-project-id')) return supabaseBackend(createClient(url, key));
  return localBackend();
}

const fail = (what: string, e: { message?: string } | null) => {
  if (e) throw new Error(`${what}: ${e.message || 'Supabase said no'}`);
};

/* ───────────── Supabase: shared between both of you ───────────── */
function supabaseBackend(sb: SupabaseClient): Backend {
  return {
    kind: 'supabase',
    async load() {
      const [items, notes, photos, settings] = await Promise.all([
        sb.from('items').select('*').order('gate'),
        sb.from('notes').select('*').order('created_at'),
        sb.from('photos').select('*').order('created_at'),
        sb.from('settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      fail('Couldn’t load your list', items.error);
      fail('Couldn’t load notes', notes.error);
      fail('Couldn’t load photos', photos.error);
      const s = settings.data as { name_a?: string; name_b?: string } | null;
      return {
        items: (items.data || []) as Item[],
        notes: (notes.data || []) as Note[],
        photos: (photos.data || []) as Photo[],
        names: { a: s?.name_a || 'Kunal', b: s?.name_b || 'Her' },
      };
    },
    async addItem(item) {
      const { data, error } = await sb.from('items').insert(item).select().single();
      fail('Couldn’t add that idea', error);
      return data as Item;
    },
    async updateItem(id, patch) {
      const { gate: _g, id: _i, created_at: _c, ...rest } = patch;
      const { error } = await sb.from('items').update(rest).eq('id', id);
      fail('Couldn’t save that change', error);
    },
    async deleteItem(item, photos) {
      const paths = photos.map(p => p.path).filter((p): p is string => !!p);
      if (paths.length) await sb.storage.from('photos').remove(paths);
      const { error } = await sb.from('items').delete().eq('id', item.id);
      fail('Couldn’t remove that idea', error);
    },
    async addNote(note) {
      const { data, error } = await sb.from('notes').insert(note).select().single();
      fail('Couldn’t save your note', error);
      return data as Note;
    },
    async addPhoto(itemId, file, who) {
      const blob = await compressImage(file, 1800, 0.84);
      const path = `${itemId}/${uid()}.jpg`;
      const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      fail('Photo upload failed', up.error);
      const { data: pub } = sb.storage.from('photos').getPublicUrl(path);
      const { data, error } = await sb
        .from('photos')
        .insert({ item_id: itemId, path, url: pub.publicUrl, uploaded_by: who })
        .select()
        .single();
      fail('Photo saved but couldn’t be linked', error);
      return data as Photo;
    },
    async deletePhoto(photo) {
      if (photo.path) await sb.storage.from('photos').remove([photo.path]);
      const { error } = await sb.from('photos').delete().eq('id', photo.id);
      fail('Couldn’t remove that photo', error);
    },
    async setNames(names) {
      const { error } = await sb.from('settings').upsert({ id: 1, name_a: names.a, name_b: names.b });
      fail('Couldn’t save names', error);
    },
    subscribe(onChange) {
      const ch = sb.channel('bucket-list');
      for (const table of ['items', 'notes', 'photos', 'settings']) {
        ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange());
      }
      ch.subscribe();
      return () => { sb.removeChannel(ch); };
    },
  };
}

/* ───────────── Demo mode: saved in this browser only ───────────── */
const LS = 'bucket-list:demo:v1';

function localBackend(): Backend {
  const read = (): Data => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) return JSON.parse(raw) as Data;
    } catch { /* fall through to seed */ }
    const d = seedData();
    write(d);
    return d;
  };
  const write = (d: Data) => {
    try {
      localStorage.setItem(LS, JSON.stringify(d));
    } catch {
      throw new Error('This browser is out of space. Connect Supabase to store more photos.');
    }
  };
  const mutate = (fn: (d: Data) => void) => { const d = read(); fn(d); write(d); };

  return {
    kind: 'local',
    async load() { return read(); },
    async addItem(item) {
      const d = read();
      const full: Item = {
        ...item, id: uid(), gate: Math.max(0, ...d.items.map(i => i.gate)) + 1,
        rating: 0, created_at: new Date().toISOString(), done_at: null, scratched: false,
      };
      d.items.push(full); write(d);
      return full;
    },
    async updateItem(id, patch) {
      mutate(d => { d.items = d.items.map(i => (i.id === id ? { ...i, ...patch } : i)); });
    },
    async deleteItem(item) {
      mutate(d => {
        d.items = d.items.filter(i => i.id !== item.id);
        d.notes = d.notes.filter(n => n.item_id !== item.id);
        d.photos = d.photos.filter(p => p.item_id !== item.id);
      });
    },
    async addNote(note) {
      const full: Note = { ...note, id: uid(), created_at: new Date().toISOString() };
      mutate(d => { d.notes.push(full); });
      return full;
    },
    async addPhoto(itemId, file, who) {
      const blob = await compressImage(file, 1000, 0.72);
      const full: Photo = {
        id: uid(), item_id: itemId, url: await blobToDataURL(blob), path: null,
        uploaded_by: who, created_at: new Date().toISOString(),
      };
      mutate(d => { d.photos.push(full); });
      return full;
    },
    async deletePhoto(photo) {
      mutate(d => { d.photos = d.photos.filter(p => p.id !== photo.id); });
    },
    async setNames(names: Names) { mutate(d => { d.names = names; }); },
    subscribe(onChange) {
      const h = (e: StorageEvent) => { if (e.key === LS) onChange(); };
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    },
  };
}
