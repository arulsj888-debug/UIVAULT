"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; font-size: 62.5%; font-family: Raleway, sans-serif; }

        .auth-bg {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 0;
        }

        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1;
        }

        .auth-center {
          position: fixed;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 2rem;
        }

        .auth-tagline {
          text-align: center;
          font-size: 1.8rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.08em;
          line-height: 1.5;
        }

        .auth-tagline span {
          display: inline;
          color: hsl(53, 100%, 59%);
          font-weight: 400;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 1.6rem;
          padding: 4.8rem 4rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }

        .auth-brand {
          font-size: 2.2rem;
          font-weight: 300;
          letter-spacing: 0.6em;
          text-transform: uppercase;
          color: #fff;
          text-align: center;
          margin-bottom: 0.8rem;
          width: 100%;
        }

        .auth-title {
          font-size: 2.8rem;
          font-weight: 300;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 3.6rem;
        }

        .auth-title span {
          display: block;
          color: hsl(53, 100%, 59%);
        }

        .auth-field {
          position: relative;
          margin-bottom: 2.4rem;
        }

        .auth-field svg {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.6;
        }

        .auth-input {
          width: 100%;
          padding: 1.4rem 1.4rem 1.4rem 4.4rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.8rem;
          color: #fff;
          font-family: Raleway, sans-serif;
          font-size: 1.5rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .auth-input::placeholder { color: rgba(255,255,255,0.4); }
        .auth-input:focus {
          border-color: hsl(53, 100%, 59%);
          background: rgba(255, 255, 255, 0.15);
        }

        .auth-btn {
          width: 100%;
          padding: 1.5rem;
          background: #fff;
          color: #000;
          font-family: Raleway, sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          border: none;
          border-radius: 0.8rem;
          cursor: pointer;
          margin-top: 0.8rem;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.05em;
        }
        .auth-btn:hover { background: hsl(53, 100%, 59%); }
        .auth-btn:active { transform: scale(0.98); }

        .auth-reset {
          display: flex;
          justify-content: space-between;
          margin-top: 1.2rem;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.4);
        }
        .auth-reset a { color: rgba(255,255,255,0.7); text-decoration: none; font-weight: 700; }
        .auth-reset a:hover { color: hsl(53, 100%, 59%); }

        .auth-footer {
          display: flex;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 3.2rem;
          padding-top: 2.4rem;
          gap: 1.2rem;
        }

        .auth-footer a, .auth-footer button {
          flex: 1;
          text-align: center;
          font-family: Raleway, sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          padding: 1rem;
          border-radius: 0.6rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
        }

        .footer-active {
          background: #fff;
          color: #000;
        }

        .footer-inactive {
          background: transparent;
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.15) !important;
        }
        .footer-inactive:hover { color: #fff; border-color: rgba(255,255,255,0.4) !important; }
      `}</style>

      {/* Fullscreen background */}
      <iframe
        className="auth-bg"
        src="/templates/car-site/bg.html"
        title="background"
        scrolling="no"
      />

      {/* Dark overlay */}
      <div className="auth-overlay" />

      {/* Centered form */}
      <div className="auth-center">
        <div className="auth-card">
          <div className="auth-brand">UIVault</div>
          <h2 className="auth-title">
            Discover the
            <span>latest trend now</span>
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                className="auth-input"
                type="text"
                placeholder="Username"
                required
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div className="auth-field">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                required
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" className="auth-btn">Sign in</button>

            <div className="auth-reset">
              <span>Forgot password?</span>
              <a href="#">Reset password</a>
            </div>
          </form>

          <div className="auth-footer">
            <Link href="/register" className="footer-inactive">Sign up</Link>
            <button className="footer-active">Sign in</button>
          </div>
        </div>

        <div className="auth-tagline">
          Where UI meets <span>pure inspiration</span>
        </div>
      </div>
    </>
  );
}
