import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="cf-footer">
      <div className="container-fluid px-4">
        <div className="row g-4 mb-4 justify-content-center">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Shield size={22} color="var(--accent-green)" />
              <span className="brand" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                CyberForge CTF
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 300 }}>
              A professional cybersecurity training and competition platform. Sharpen your skills through real-world inspired challenges.
            </p>
          </div>

          <div className="col-6 col-lg-2">
            <div className="section-title mb-3" style={{ fontSize: '0.65rem' }}>Platform</div>
            {[
              { to: '/challenges', label: 'Challenges' },
              { to: '/leaderboard', label: 'Leaderboard' },
              { to: '/events', label: 'Events' },
              { to: '/about', label: 'About' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent-green)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="col-6 col-lg-2">
            <div className="section-title mb-3" style={{ fontSize: '0.65rem' }}>Categories</div>
            {['Web Exploitation', 'Cryptography', 'Reverse Engineering', 'Binary Exploitation', 'OSINT'].map(cat => (
              <Link key={cat} to="/challenges" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent-green)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            © 2026 CyberForge CTF. All rights reserved.
          </span>
          <div className="d-flex gap-3">
            {['Privacy Policy', 'Terms of Service', 'Rules'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent-green)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
