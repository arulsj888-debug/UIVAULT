"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BADGE_CYCLE = ['Premium', 'Featured', 'New', 'Updated', 'System', 'Stable'];
const PAGE_SIZE = 10;

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [filter, setFilter] = useState('All Templates');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setTemplates(data) : setTemplates([]));
  }, []);

  // Sync page + search from URL on mount and URL changes
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get('page'));
      const s = params.get('search') || '';
      if (p && p > 0) setPage(p); else setPage(1);
      setSearch(s);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  // Keep URL in sync with page state (only when not searching)
  useEffect(() => {
    if (search) return;
    const url = page === 1 ? '/' : `/?page=${page}`;
    window.history.replaceState(null, '', url);
  }, [page, search]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, search]);

  const filters = ['All Templates', 'Saas', 'E-commerce', 'Portfolio'];

  // Filter by search query — rank exact matches first, then partial
  const filtered = search
    ? templates
        .filter(t => t.toLowerCase().replace(/-/g, ' ').includes(search.toLowerCase()))
        .sort((a, b) => {
          const aName = a.toLowerCase().replace(/-/g, ' ');
          const bName = b.toLowerCase().replace(/-/g, ' ');
          const q = search.toLowerCase();
          const aStarts = aName.startsWith(q) ? 0 : 1;
          const bStarts = bName.startsWith(q) ? 0 : 1;
          return aStarts - bStarts;
        })
    : templates;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = search ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <main className="pt-32 pb-24 px-8 mx-auto" style={{ maxWidth: '1440px' }}>

      {/* Header */}
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div style={{ maxWidth: '42rem' }}>
          <span className="uppercase tracking-widest text-xs mb-4 block" style={{ fontFamily: 'Space Grotesk', color: '#a3a6ff', letterSpacing: '0.2em' }}>
            {search ? `Search results for "${search}"` : 'Digital Gallery'}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {search ? (
              <>{filtered.length} <span style={{ color: '#acaab0' }}>Result{filtered.length !== 1 ? 's' : ''}</span></>
            ) : (
              <>The Curated <br /><span style={{ color: '#acaab0' }}>Collection</span></>
            )}
          </h1>
        </div>
        {!search && (
          <div className="flex flex-wrap gap-3">
            {filters.map(f => (
              <span key={f} onClick={() => setFilter(f)} className="cursor-pointer uppercase transition-colors"
                style={{ fontFamily: 'Space Grotesk', fontSize: '10px', padding: '8px 16px', borderRadius: '999px', border: '1px solid rgba(72,71,76,0.3)', color: '#acaab0', letterSpacing: '0.1em', backgroundColor: filter === f ? '#25252b' : '#131317' }}>
                {f}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ color: '#76757a', textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '14px' }}>No templates found{search ? ` for "${search}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {paginated.map((name, i) => (
            <div key={name} className="group">
              <Link
                href={`/template/${name}?tab=preview&from=${page}`}
                className="block relative overflow-hidden mb-6"
                style={{
                  aspectRatio: '4/5',
                  backgroundColor: '#131317',
                  borderRadius: '0.5rem',
                  transition: 'transform 0.5s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <iframe
                  src={`/templates/${name}/index.html`}
                  title={name}
                  scrolling="no"
                  className="w-full h-full border-none pointer-events-none"
                  style={{ filter: 'grayscale(1)', transition: 'filter 0.7s', overflow: 'hidden' }}
                />
                <div
                  className="absolute inset-0 flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                >
                  <span className="text-xs tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk', color: '#d6cbff', fontSize: '10px' }}>
                    VER 1.0.0
                  </span>
                </div>
              </Link>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    {name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>
                  <span
                    className="uppercase"
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: '10px',
                      color: '#acaab0',
                      padding: '4px 8px',
                      backgroundColor: '#19191e',
                    }}
                  >
                    {BADGE_CYCLE[i % BADGE_CYCLE.length]}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/template/${name}?tab=preview&from=${page}`}
                    className="flex-1 text-center uppercase font-bold tracking-widest py-3 px-6 transition-all active:scale-95"
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: '12px',
                      borderRadius: '0.25rem',
                      border: '1px solid rgba(72,71,76,0.2)',
                      color: '#fcf8fe',
                    }}
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/template/${name}?tab=html&from=${page}`}
                    className="flex-1 text-center uppercase font-bold tracking-widest py-3 px-6 transition-all active:scale-95"
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: '12px',
                      borderRadius: '0.25rem',
                      background: 'linear-gradient(135deg, #a3a6ff, #6063ee)',
                      color: '#000000',
                    }}
                  >
                    Code
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer pagination — hidden during search */}
      {!search && (
        <footer className="mt-32 pt-16 flex flex-col md:flex-row justify-between items-center gap-8" style={{ borderTop: '1px solid rgba(72,71,76,0.1)' }}>
          <div className="text-sm" style={{ fontFamily: 'Space Grotesk', color: '#acaab0' }}>
            Showing {start}–{end} of {filtered.length} templates
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-12 h-12 flex items-center justify-center text-white transition-all disabled:opacity-30"
              style={{ borderRadius: '0.25rem', border: '1px solid rgba(72,71,76,0.2)' }}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-12 h-12 flex items-center justify-center font-bold transition-all"
                style={{ borderRadius: '0.25rem', backgroundColor: page === p ? '#a3a6ff' : 'transparent', color: page === p ? '#000000' : '#acaab0', border: page === p ? 'none' : '1px solid rgba(72,71,76,0.2)', fontFamily: 'Space Grotesk' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-12 h-12 flex items-center justify-center text-white transition-all disabled:opacity-30"
              style={{ borderRadius: '0.25rem', border: '1px solid rgba(72,71,76,0.2)' }}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
