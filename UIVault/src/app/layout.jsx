"use client";
import './globals.css';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body text-on-surface selection:bg-primary/30" style={{ backgroundColor: '#0e0e12' }}>
        {!isAuthPage && (
          <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-20" style={{ backgroundColor: 'rgba(25,25,30,0.7)', backdropFilter: 'blur(24px)' }}>
            <div className="flex items-center gap-12">
              <Link href="/" className="text-2xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>UIVault</Link>
              <div className="hidden md:flex items-center gap-8 tracking-tight text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                <a className="font-bold pb-1" style={{ color: '#a3a6ff', borderBottom: '2px solid #a3a6ff' }} href="#">Gallery</a>
                <a className="hover:text-white transition-colors" style={{ color: '#9ca3af' }} href="#">Components</a>
                <a className="hover:text-white transition-colors" style={{ color: '#9ca3af' }} href="#">Pro</a>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center rounded-md px-4 py-2 w-64" style={{ backgroundColor: '#1f1f24' }}>
                <span className="material-symbols-outlined text-sm mr-2" style={{ color: '#76757a', fontSize: '18px' }}>search</span>
                <input className="bg-transparent border-none text-sm focus:outline-none w-full" placeholder="Search templates..." style={{ color: '#fcf8fe', fontFamily: 'Space Grotesk' }} />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleLogout} className="hover:text-white transition-colors text-sm px-4 py-2 rounded-md hover:bg-opacity-20 active:scale-95 duration-200" style={{ color: '#9ca3af', fontFamily: 'Plus Jakarta Sans' }}>
                  Logout
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#25252b', border: '1px solid rgba(72,71,76,0.2)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#a3a6ff' }}>person</span>
                </div>
              </div>
            </div>
          </nav>
        )}
        {children}
        {!isAuthPage && (
          <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center py-4 px-6 z-50 md:hidden" style={{ borderTop: '1px solid rgba(72,71,76,0.2)', backgroundColor: 'rgba(19,19,23,0.8)', backdropFilter: 'blur(16px)' }}>
            <div className="flex flex-col items-center justify-center rounded-xl p-2" style={{ backgroundColor: '#19191e', color: '#a3a6ff' }}>
              <span className="material-symbols-outlined">grid_view</span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ fontFamily: 'Space Grotesk', fontSize: '10px' }}>Home</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 hover:text-white transition-all" style={{ color: '#48474c' }}>
              <span className="material-symbols-outlined">search</span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ fontFamily: 'Space Grotesk', fontSize: '10px' }}>Search</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 hover:text-white transition-all" style={{ color: '#48474c' }}>
              <span className="material-symbols-outlined">bookmark</span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ fontFamily: 'Space Grotesk', fontSize: '10px' }}>Saved</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 hover:text-white transition-all" style={{ color: '#48474c' }}>
              <span className="material-symbols-outlined">person</span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ fontFamily: 'Space Grotesk', fontSize: '10px' }}>Profile</span>
            </div>
          </nav>
        )}
      </body>
    </html>
  );
}
