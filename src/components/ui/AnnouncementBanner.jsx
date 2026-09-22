import React, { useEffect, useState } from 'react';
import { Megaphone, X, Info, AlertTriangle, Wrench } from 'lucide-react';
import { announcementService } from '../../services/announcementService';

const PRIORITY_STYLES = {
  info:       { color: 'var(--accent-cyan)',    bg: 'rgba(61,221,208,0.1)',    border: 'rgba(61,221,208,0.3)',    icon: Info },
  update:     { color: 'var(--accent-green)',   bg: 'rgba(16,185,129,0.1)',    border: 'rgba(16,185,129,0.3)',    icon: Info },
  maintenance:{ color: 'var(--accent-yellow)',  bg: 'rgba(234,179,8,0.1)',     border: 'rgba(234,179,8,0.3)',     icon: Wrench },
  urgent:     { color: 'var(--accent-red)',     bg: 'rgba(239,68,68,0.1)',     border: 'rgba(239,68,68,0.35)',    icon: AlertTriangle },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const all = await announcementService.getActiveAnnouncements();
      if (!alive) return;
      const dismissed = new Set(announcementService.getDismissed());
      setAnnouncements(all.filter(a => !dismissed.has(a.id)));
    };
    load();
    const iv = setInterval(load, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  if (!announcements.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {announcements.map(a => {
        const style = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.info;
        const Icon = style.icon;
        return (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: style.bg, border: `1px solid ${style.border}`,
            borderLeft: `3px solid ${style.color}`,
            borderRadius: 10, padding: '10px 14px', margin: '12px 0 0',
            animation: 'fadeInDown 0.3s ease',
          }}>
            <div style={{ color: style.color, flexShrink: 0, display: 'flex' }}>
              <Icon size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {a.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 1 }}>{a.body}</div>
            </div>
            <button
              onClick={() => { announcementService.dismiss(a.id); setAnnouncements(prev => prev.filter(x => x.id !== a.id)); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: 4, display: 'flex' }}
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}