import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Category, Data, Item, Names, Photo, Who } from './types';
import { makeBackend } from './backends';

interface Toast { id: number; text: string }

interface Store {
  data: Data | null;
  error: string | null;
  mode: 'supabase' | 'local';
  me: Who | null;
  setMe(w: Who): void;
  openId: string | null;
  open(id: string | null): void;
  addOpen: boolean;
  setAddOpen(v: boolean): void;
  namesOpen: boolean;
  setNamesOpen(v: boolean): void;
  lightbox: { photos: Photo[]; index: number } | null;
  setLightbox(v: { photos: Photo[]; index: number } | null): void;
  toasts: Toast[];
  toast(text: string): void;
  uploading: Record<string, number>;
  freshId: string | null;
  retry(): void;
  actions: {
    addItem(title: string, category: Category): Promise<Item | null>;
    update(id: string, patch: Partial<Item>): Promise<void>;
    remove(item: Item): Promise<void>;
    addNote(itemId: string, body: string): Promise<boolean>;
    addPhotos(itemId: string, files: FileList | File[]): Promise<void>;
    removePhoto(p: Photo): Promise<void>;
    setNames(n: Names): Promise<void>;
  };
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}

const readMe = (): Who | null => {
  try { const v = localStorage.getItem('bucket-list:me'); return v === 'a' || v === 'b' ? v : null; } catch { return null; }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(makeBackend, []);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMeState] = useState<Who | null>(readMe);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Store['lightbox']>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [freshId, setFreshId] = useState<string | null>(null);
  const timer = useRef<number>();

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setData(await backend.load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t load your list.');
    }
  }, [backend]);

  const soon = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(refresh, 180);
  }, [refresh]);

  useEffect(() => {
    refresh();
    return backend.subscribe(soon);
  }, [backend, refresh, soon]);

  const guard = useCallback(async (fn: () => Promise<void>) => {
    try { await fn(); } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      refresh();
    }
  }, [toast, refresh]);

  const setMe = useCallback((w: Who) => {
    setMeState(w);
    try { localStorage.setItem('bucket-list:me', w); } catch { /* private mode */ }
  }, []);

  const actions: Store['actions'] = useMemo(() => ({
    async addItem(title, category) {
      const who = me || 'a';
      try {
        const item = await backend.addItem({ title, category, status: 'scheduled', created_by: who, hearts: { [who]: true } });
        setData(d => d && { ...d, items: [...d.items.filter(i => i.id !== item.id), item] });
        setFreshId(item.id);
        window.setTimeout(() => setFreshId(null), 1500);
        return item;
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Couldn’t add that idea.');
        return null;
      }
    },
    async update(id, patch) {
      setData(d => d && { ...d, items: d.items.map(i => (i.id === id ? { ...i, ...patch } : i)) });
      await guard(() => backend.updateItem(id, patch));
    },
    async remove(item) {
      const photos = data?.photos.filter(p => p.item_id === item.id) || [];
      setData(d => d && { ...d, items: d.items.filter(i => i.id !== item.id) });
      await guard(() => backend.deleteItem(item, photos));
    },
    async addNote(itemId, body) {
      if (!me) return false;
      try {
        const n = await backend.addNote({ item_id: itemId, author: me, body });
        setData(d => d && { ...d, notes: [...d.notes.filter(x => x.id !== n.id), n] });
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Couldn’t save your note.');
        return false;
      }
    },
    async addPhotos(itemId, files) {
      const list = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
      if (!list.length) { toast('Pick a photo file.'); return; }
      setUploading(u => ({ ...u, [itemId]: (u[itemId] || 0) + list.length }));
      let ok = 0;
      for (const f of list) {
        try {
          const p = await backend.addPhoto(itemId, f, me || 'a');
          setData(d => d && { ...d, photos: [...d.photos.filter(x => x.id !== p.id), p] });
          ok++;
        } catch (e) {
          toast(e instanceof Error ? e.message : 'A photo didn’t upload.');
        } finally {
          setUploading(u => ({ ...u, [itemId]: Math.max(0, (u[itemId] || 1) - 1) }));
        }
      }
      if (ok) toast(ok === 1 ? 'Photo added' : `${ok} photos added`);
    },
    async removePhoto(p) {
      setData(d => d && { ...d, photos: d.photos.filter(x => x.id !== p.id) });
      await guard(() => backend.deletePhoto(p));
    },
    async setNames(n) {
      setData(d => d && { ...d, names: n });
      await guard(() => backend.setNames(n));
    },
  }), [backend, me, guard, toast, data]);

  const value: Store = {
    data, error, mode: backend.kind, me, setMe,
    openId, open: setOpenId, addOpen, setAddOpen, namesOpen, setNamesOpen,
    lightbox, setLightbox, toasts, toast, uploading, freshId, retry: refresh, actions,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** items + notes + photos for one item, kept together */
export function useItemBits(id: string) {
  const { data } = useStore();
  return useMemo(() => ({
    notes: data?.notes.filter(n => n.item_id === id) || [],
    photos: data?.photos.filter(p => p.item_id === id) || [],
  }), [data, id]);
}
