import type { ReactNode } from 'react';
import type { Category } from '../lib/types';

const P: Record<Category, ReactNode> = {
  travel: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></>,
  food: <><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M8 21h8" /><path d="M14 3l-4 7" /><path d="M19 4l-6 6" /></>,
  adventure: <><path d="M2 20l7-11 4 6 3-4 6 9z" /><circle cx="17" cy="5" r="2" /></>,
  cozy: <><path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 11h2a3 3 0 0 1 0 6h-2" /><path d="M8 3c0 2 2 2 2 4" /><path d="M12 3c0 2 2 2 2 4" /></>,
  fun: <><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v4" /><path d="M8 22h8" /></>,
  creative: <><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /></>,
};

const svg = (children: ReactNode, size: number, sw = 1.7) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const CatIcon = ({ cat, size = 20 }: { cat: Category; size?: number }) => svg(P[cat], size);

export const HeartIcon = ({ filled, size = 16 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.4-9-9a4.6 4.6 0 0 1 9-3 4.6 4.6 0 0 1 9 3c-2 4.6-9 9-9 9z" />
  </svg>
);
export const PlusIcon = ({ size = 18 }) => svg(<><path d="M12 5v14" /><path d="M5 12h14" /></>, size, 2);
export const CameraIcon = ({ size = 18 }) => svg(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>, size);
export const XIcon = ({ size = 18 }) => svg(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>, size, 2);
export const ArrowIcon = ({ dir = 'right', size = 20 }: { dir?: 'left' | 'right'; size?: number }) =>
  svg(dir === 'right' ? <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></> : <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>, size, 2);
export const SendIcon = ({ size = 18 }) => svg(<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>, size, 2.2);
export const TrashIcon = ({ size = 16 }) => svg(<><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>, size);
