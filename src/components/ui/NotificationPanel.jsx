import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CheckCircle, Trophy, Zap, Calendar, TrendingUp, Lightbulb, Bell,
  Trash2, CheckCheck, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from './LoadingSpinner';

const iconMap = {
  CheckCircle, Trophy, Zap, Calendar, TrendingUp, Lightbulb, Bell,
};

const typeColors = {
  // Server vocabulary.
  system: 'var(--accent-green)',
  challenge: 'var(--accent-green)',
  achievement: 'var(--accent-green)',
  announcement: 'var(--accent-cyan)',
  // Legacy keys kept so any older cached shape still renders.
  solve: 'var(--accent-green)',
  new_challenge: 'var(--accent-cyan)',
  event: 'var(--accent-green)',
  rank: 'var(--accent-purple)',
  hint: 'var(--accent-green)',
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * A destination is only followed when it is a same-application path. This
 * mirrors the server-side rule (see notifications.models.validate_destination_url)
 * and means a `javascript:` or absolute URL can never be navigated to.
 */
function safeDestination(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : null;
}

export default function NotificationPanel({ onClose }) {
  const {
    notifications, unreadCount, notificationsLoading, notificationsError,
    markNotifRead, markAllNotifsRead, deleteNotification, loadNotifications,
  } = useApp();
  const navigate = useNavigate();

  const handleOpen = async (n) => {
    const target = safeDestination(n.destination);
    try {
      if (!n.read) await markNotifRead(n.id);
      if (target) {
        if (onClose) onClose();
        navigate(target);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not update the notification.');
    }
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (err) {
      toast.error(err?.message || 'Could not delete the notification.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotifsRead();
    } catch (err) {
      toast.error(err?.message || 'Could not mark notifications as read.');
    }
  };

  const showLoading = notificationsLoading && notifications.length === 0;

  return (
    <div className="notif-panel">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {showLoading ? (
          <div style={{ padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner size={24} text="Loading…" />
          </div>
        ) : notificationsError && notifications.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-red)', marginBottom: 8 }} />
            <div>{notificationsError}</div>
            <button
              onClick={() => loadNotifications()}
              style={{ marginTop: 12, background: 'none', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--accent-green)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', padding: '6px 12px' }}
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
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
                onClick={() => handleOpen(n)}
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
                <button
                  type="button"
                  aria-label="Delete notification"
                  title="Delete"
                  onClick={(event) => handleDelete(event, n.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, alignSelf: 'center', padding: 2 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
