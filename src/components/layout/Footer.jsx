import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="cf-footer">
      <div className="container-fluid px-4">
        <div className="row g-4 mb-4">
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
            <div className="d-flex gap-2 mt-3">
              {[
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Globe, href: '#', label: 'Website' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label} href={href}
                  style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
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

          <div className="col-lg-4">
            <div className="section-title mb-3" style={{ fontSize: '0.65rem' }}>System Status</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px' }}>
              {[
                { label: 'API Server', status: 'Operational' },
                { label: 'Challenge Instances', status: 'Operational' },
                { label: 'Scoreboard', status: 'Operational' },
                { label: 'Flag Submission', status: 'Operational' },
              ].map(({ label, status }) => (
                <div key={label} className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--diff-easy)' }}>
                    <span className="status-dot green" style={{ width: 6, height: 6 }} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
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
