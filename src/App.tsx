import { useEffect, type CSSProperties } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import { INK, initial } from './lib/meta';
import type { Who } from './lib/types';
import { ListPage } from './pages/ListPage';
import { PinboardPage } from './pages/PinboardPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ItemSheet } from './components/ItemSheet';
import { AddIdea, Lightbox, NamesDialog, Toasts, WhoAmI } from './components/overlays';
import { PlusIcon } from './components/icons';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </StoreProvider>
  );
}

function Shell() {
  const { data, error, retry, mode, setAddOpen, setNamesOpen } = useStore();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <InkFilter />
      <TopBar />
      {error && !data && (
        <div className="page empty">
          <p className="serif">The board didn't load.</p>
          <p className="err">{error}</p>
          <button className="btn-ink" onClick={retry}>Try again</button>
        </div>
      )}
      {!data && !error && <div className="page loading-page"><span className="mono tiny">PRINTING TICKETS…</span></div>}
      {data && (
        <div key={pathname} className="route">
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/pinboard" element={<PinboardPage />} />
            <Route path="/memories" element={<MemoriesPage />} />
            <Route path="*" element={<ListPage />} />
          </Routes>
        </div>
      )}
      {data && (
        <footer className="foot mono">
          <span>BUCKET LIST · ISSUE Nº 01</span>
          <button onClick={() => setNamesOpen(true)}>CHANGE NAMES</button>
          <span>{mode === 'supabase' ? 'SYNCED FOR BOTH OF YOU' : 'DEMO MODE · SAVED IN THIS BROWSER'}</span>
        </footer>
      )}
      {data && (
        <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add a new idea"><PlusIcon size={24} /></button>
      )}
      <ItemSheet />
      <AddIdea />
      <NamesDialog />
      <WhoAmI />
      <Lightbox />
      <Toasts />
    </>
  );
}

function TopBar() {
  const { data, me, setMe, mode } = useStore();
  const names = data?.names || { a: 'Kunal', b: 'Meghavi' };
  return (
    <header className="topbar">
      <NavLink to="/" className="brand" aria-label="Bucket list home">
        <span className="brand-dots" aria-hidden="true"><i /><i /></span>
        <span className="mono">Nº 01 · {initial(names.a)} + {initial(names.b)}</span>
      </NavLink>
      <nav className="nav mono" aria-label="Pages">
        <NavLink to="/" end>LIST</NavLink>
        <NavLink to="/pinboard">PINBOARD</NavLink>
        <NavLink to="/memories">MEMORIES</NavLink>
      </nav>
      <div className="me" role="group" aria-label="Who's writing">
        <span className={`sync ${mode}`} title={mode === 'supabase' ? 'Live sync on' : 'Demo mode: saved in this browser only'} />
        {(['a', 'b'] as Who[]).map(w => (
          <button key={w} className={me === w ? 'on' : ''} aria-pressed={me === w} onClick={() => setMe(w)}
            style={{ '--ink': INK[w] } as CSSProperties} title={`Write as ${names[w]}`}>
            {names[w]}
          </button>
        ))}
      </div>
    </header>
  );
}

/* rough ink edges for stamps */
function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="ink">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
      </filter>
    </svg>
  );
}
