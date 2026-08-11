import { create } from 'zustand';

export interface BoardItem {
  id: string;
  type: 'photo' | 'text';
  filename?: string | null;
  filepath?: string | null;
  thumbnail?: string | null;
  mimeType?: string | null;
  size?: number | null;
  content?: string | null;
  posX: number;
  posY: number;
  rotation: number;
  roast?: string | null;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  items: BoardItem[];
  setItems: (items: BoardItem[]) => void;
  addItem: (item: BoardItem) => void;
  updateItem: (id: string, data: Partial<BoardItem>) => void;
  removeItem: (id: string) => void;
  maxZIndex: number;
  bumpZIndex: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items, maxZIndex: Math.max(0, ...items.map((i) => i.zIndex)) }),
  addItem: (item) => set((s) => ({ items: [...s.items, item], maxZIndex: Math.max(s.maxZIndex, item.zIndex) })),
  updateItem: (id, data) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  maxZIndex: 0,
  bumpZIndex: () => {
    const next = get().maxZIndex + 1;
    set({ maxZIndex: next });
    return next;
  },
}));
