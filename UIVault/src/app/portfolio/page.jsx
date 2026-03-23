"use client";
import { useEffect } from 'react';

export default function PortfolioPage() {
  useEffect(() => {
    // Redirect to the static portfolio build
    window.location.href = '/portfolio/index.html';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading Portfolio...</div>
        <div style={{ fontSize: '1rem', opacity: 0.6 }}>Redirecting to portfolio site</div>
      </div>
    </div>
  );
}
