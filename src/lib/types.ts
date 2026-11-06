export type Who = 'a' | 'b';
export type Status = 'scheduled' | 'boarding' | 'delayed' | 'departed';
export type Category = 'travel' | 'food' | 'adventure' | 'cozy' | 'fun' | 'creative';

export interface Item {
  id: string;
  gate: number;
  title: string;
  category: Category;
  status: Status;
  rating: number;
  created_by: Who;
  created_at: string;
  done_at: string | null;
  hearts: { a?: boolean; b?: boolean };
  scratched: boolean;
}

export interface Note {
  id: string;
  item_id: string;
  author: Who;
  body: string;
  created_at: string;
}

export interface Photo {
  id: string;
  item_id: string;
  url: string;
  path: string | null;
  uploaded_by: Who;
  created_at: string;
}

export interface Names {
  a: string;
  b: string;
}

export interface Data {
  items: Item[];
  notes: Note[];
  photos: Photo[];
  names: Names;
}

export type NewItem = Pick<Item, 'title' | 'category' | 'status' | 'created_by' | 'hearts'>;

export interface Backend {
  kind: 'supabase' | 'local';
  load(): Promise<Data>;
  addItem(item: NewItem): Promise<Item>;
  updateItem(id: string, patch: Partial<Item>): Promise<void>;
  deleteItem(item: Item, photos: Photo[]): Promise<void>;
  addNote(note: { item_id: string; author: Who; body: string }): Promise<Note>;
  addPhoto(itemId: string, file: File, who: Who): Promise<Photo>;
  deletePhoto(photo: Photo): Promise<void>;
  setNames(names: Names): Promise<void>;
  subscribe(onChange: () => void): () => void;
}
