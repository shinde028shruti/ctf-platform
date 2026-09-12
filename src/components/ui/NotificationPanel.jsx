import React from 'react';
import { CheckCircle, Trophy, Zap, Calendar, TrendingUp, Lightbulb, Bell, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const iconMap = {
  CheckCircle, Trophy, Zap, Calendar, TrendingUp, Lightbulb, Bell,
};

const typeColors = {
  solve: 'var(--accent-green)',
  achievement: 'var(--accent-green)',
  new_challenge: 'var(--accent-cyan)',
  event: 'var(--accent-green)',
  rank: 'var(--accent-purple)',
  hint: 'var(--accent-green)',
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel({ onClose }) {
  const { notifications, markNotifRead, clearAllNotifications } = useApp();

  return (
    <div className="notif-panel">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
        {notifications.length > 0 && (
          <button
            onClick={() => clearAllNotifications()}
            style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            No notifications
          </div>
        ) : (
          notifications.map(n => {
            const IconComp = iconMap[n.icon] || Bell;
            const color = typeColors[n.type] || 'var(--accent-green)';
            return (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={() => markNotifRead(n.id)}
              >
                <div className="notif-icon" style={{ color, background: `${color}15` }}>
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.timestamp)}</div>
                </div>
                {!n.read && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent-green)', flexShrink: 0, alignSelf: 'center',
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
