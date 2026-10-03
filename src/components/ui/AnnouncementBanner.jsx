import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, X, Info, AlertTriangle, Wrench } from 'lucide-react';
import { announcementService } from '../../services/announcementService';

const PRIORITY_STYLES = {
  info:        { color: 'var(--accent-cyan)',   bg: 'rgba(61,221,208,0.10)',  border: 'rgba(61,221,208,0.30)',  icon: Info },
  update:      { color: 'var(--accent-green)',  bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)',  icon: Info },
  maintenance: { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.10)',   border: 'rgba(234,179,8,0.30)',   icon: Wrench },
  urgent:      { color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.35)',   icon: AlertTriangle },
};

/** Sits above .app-layout and below the navbar (z-index 1000), so it spans the
 *  full window width without ever being covered by the sticky sidebar. */
export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const barRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const all = await announcementService.getActiveAnnouncements();
      if (!alive) return;
      const dismissed = announcementService.getDismissed();
      setAnnouncements(all.filter(a => !dismissed.has(String(a.id))));
    };
    load();
    const iv = setInterval(load, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  // Publish the bar's height so the sticky sidebar can subtract it instead of
  // overflowing by that much and gaining a phantom scrollbar. Recomputed when
  // the set of visible announcements changes (each row wraps on narrow screens)
  // and on resize, so it stays correct rather than being measured once.
  useEffect(() => {
    const root = document.documentElement;
    const publish = () => {
      const h = barRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--announcement-h', `${h}px`);
    };
    publish();
    if (!barRef.current) return undefined;
    const ro = new ResizeObserver(publish);
    ro.observe(barRef.current);
    window.addEventListener('resize', publish);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', publish);
      root.style.setProperty('--announcement-h', '0px');
    };
  }, [announcements]);

  // Drop from state first so the bar disappears on click, then persist. The
  // service also keeps an in-memory copy, so a blocked localStorage cannot
  // resurrect the banner on the next 60s refresh.
  const dismiss = (a) => {
    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
    announcementService.dismiss(a.id);
  };

  const dismissAll = () => {
    announcementService.dismissAll(announcements.map(a => a.id));
    setAnnouncements([]);
  };

  if (!announcements.length) return null;

  return (
    <div className="announcement-bar" ref={barRef}>
      <div className="announcement-bar-inner">
        {announcements.map((a, i) => {
          const style = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.info;
          const Icon = style.icon;
          const isLast = i === announcements.length - 1;
          return (
            <div key={a.id} className="announcement-item" style={{
              background: style.bg,
              borderColor: style.border,
              borderLeftColor: style.color,
              marginBottom: isLast ? 0 : 8,
            }}>
              <span style={{ color: style.color, flexShrink: 0, display: 'flex' }}>
                <Icon size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="announcement-title">{a.title}</div>
                <div className="announcement-body">{a.body}</div>
              </div>
              {announcements.length > 1 && (
                <button
                  type="button"
                  className="announcement-dismiss-all"
                  onClick={dismissAll}
                  title="Dismiss all announcements"
                >
                  Dismiss all
                </button>
              )}
              <button
                type="button"
                className="announcement-close"
                onClick={() => dismiss(a)}
                aria-label={`Dismiss announcement: ${a.title}`}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}