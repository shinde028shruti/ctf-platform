import React from 'react';
import { Shield, Flag, Trophy, Users, Globe, Lock, Cpu, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div className="page-header animate-fade-in-up">
        <div className="section-title mb-2">About</div>
        <h1 style={{ margin: 0 }}>About CyberForge CTF</h1>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '32px', marginBottom: 24, animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Shield size={40} color="var(--accent-green)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.5rem', margin: 0 }}>CyberForge CTF</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Professional Cybersecurity Training Platform</p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
          CyberForge CTF is a professional cybersecurity training and competition platform designed for learners at all skill levels — from complete beginners to seasoned security researchers.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
          Our challenges are inspired by real-world vulnerability classes found in bug bounty programs, penetration testing engagements, and security research. Every flag you capture represents a real skill learned.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {[
          { icon: Flag,    color: 'var(--accent-green)',  title: 'Jeopardy-Style CTF',       desc: 'Our challenges follow the Jeopardy format — solve problems across categories to earn points. No attack/defense complexity.' },
          { icon: Globe,   color: 'var(--accent-cyan)',   title: 'Real-World Scenarios',     desc: 'Challenges are modeled after real vulnerability classes seen in production environments and bug bounty programs.' },
          { icon: Trophy,  color: '#ffd700',              title: 'Competitive Events',       desc: 'Participate in timed events to compete for prizes and recognition on the global stage.' },
          { icon: Users,   color: 'var(--accent-green)',   title: 'Community Driven',         desc: 'Challenges authored by security professionals and experienced CTF players from around the world.' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="col-md-6 animate-fade-in-up">
            <div className="cf-card p-4 h-100">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 14 }}>
                <Icon size={20} />
              </div>
              <h5 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h5>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '28px', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
        <h4 style={{ marginBottom: 16 }}>Ready to start?</h4>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Create a free account and start solving challenges today. No prerequisites — just curiosity and persistence.
        </p>
        <div className="d-flex gap-3 flex-wrap">
          <Link to="/register" className="btn btn-primary">Create Free Account</Link>
          <Link to="/challenges" className="btn btn-outline-primary">Browse Challenges</Link>
        </div>
      </div>
    </div>
  );
}
