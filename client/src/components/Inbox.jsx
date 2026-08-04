import { useState, useCallback, useRef, useEffect } from 'react';
import { api, timeAgo } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Sheet, Avatar, Empty, Skeletons } from './ui.jsx';

/**
 * Riffpost – die Muschel oben rechts.
 * Zu ist sie ruhig, mit neuer Post glimmt eine Perle und es steigen Blasen auf.
 */
export default function Inbox() {
  const { unread, setUnread, refreshUnread, lastEvent, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [arrived, setArrived] = useState(false);
  // Welche Karten waren neu? Danach werden sie serverseitig sofort als gelesen
  // markiert – die Hervorhebung soll aber sichtbar bleiben, solange die
  // Muschel offen ist. Deshalb sammeln statt ersetzen.
  const freshKeys = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const d = await api.get('/notifications');
      for (const i of d.items) if (i.unread) freshKeys.current.add(i.key);
      setItems(d.items);
      if (d.unread > 0) {
        await api.post('/notifications/read');
        setUnread(0);
      }
    } catch (e) {
      toast(e.message, 'err');
      setItems((prev) => prev ?? []);
    }
  }, [setUnread, toast]);

  const openInbox = useCallback(() => {
    setOpen(true);
    setItems(null);
    freshKeys.current = new Set();
    load();
  }, [load]);

  // Kommt Post herein, während die Muschel offen ist, rutscht sie direkt mit
  // in die Liste – ohne dass man schließen und neu öffnen muss.
  useEffect(() => {
    if (!open || !lastEvent) return;
    load();
  }, [lastEvent, open, load]);

  // Kurzer Impuls, sobald der Zähler steigt: die Muschel meldet sich.
  const prevUnread = useRef(unread);
  useEffect(() => {
    if (unread > prevUnread.current) {
      setArrived(true);
      const t = setTimeout(() => setArrived(false), 750);
      prevUnread.current = unread;
      return () => clearTimeout(t);
    }
    prevUnread.current = unread;
  }, [unread]);

  const close = () => {
    setOpen(false);
    freshKeys.current = new Set();
    refreshUnread();
  };

  const go = (item) => {
    setOpen(false);
    if (item.logId) navigate(`/log/${item.logId}`);
  };

  const has = unread > 0;

  return (
    <>
      <button
        className={`shell-btn ${has ? 'has-post' : ''} ${arrived ? 'arrived' : ''}`}
        onClick={openInbox}
        title="Riffpost"
        aria-label={has ? `Riffpost, ${unread} neu` : 'Riffpost'}
      >
        <span className="shell">🐚</span>
        {has && (
          <>
            <span className="pearl">{unread > 9 ? '9+' : unread}</span>
            <span className="shell-bubbles" aria-hidden="true">
              <i /><i /><i />
            </span>
          </>
        )}
      </button>

      <Sheet open={open} onClose={close} title="🐚 Riffpost">
        <div className="inbox">
          {items === null && <Skeletons n={4} height={62} />}

          {items?.length === 0 && (
            <Empty
              emoji="🐚"
              title="Deine Muschel ist leer"
              text="Sobald jemand auf deine Putzaktionen reagiert, landet es hier."
            />
          )}

          {items?.map((item) => (
            <NotificationRow
              key={item.key}
              item={item}
              fresh={freshKeys.current.has(item.key)}
              onClick={() => go(item)}
            />
          ))}
        </div>
      </Sheet>
    </>
  );
}

/* ---------- Eine Karte ---------- */
function NotificationRow({ item, fresh, onClick }) {
  const { icon, text } = describe(item);
  return (
    <button className={`notif ${fresh ? 'fresh' : ''}`} onClick={onClick}>
      <span className="notif-mark" aria-hidden="true">
        <Avatar fish={item.actors[0].fish} color={item.actors[0].color} size={36} />
        <span className="notif-kind">{icon}</span>
      </span>

      <span className="notif-body">
        <span className="notif-text">{text}</span>
        {item.log && (
          <span className="notif-log">
            {item.log.icon} {item.log.activityName}
          </span>
        )}
        {item.type !== 'reaction' && item.preview && (
          <span className="notif-preview">„{item.preview}“</span>
        )}
      </span>

      <span className="notif-side">
        {item.emojis.length > 0 && <span className="notif-emojis">{item.emojis.slice(0, 3).join('')}</span>}
        <span className="notif-time">{timeAgo(item.createdAt)}</span>
      </span>
    </button>
  );
}

/* ---------- Text pro Anlass ---------- */
function names(actors) {
  const [a, b] = actors;
  if (actors.length === 1) return a.displayName;
  if (actors.length === 2) return `${a.displayName} und ${b.displayName}`;
  return `${a.displayName} und ${actors.length - 1} andere`;
}

function describe(item) {
  const who = names(item.actors);
  const many = item.actors.length > 1;
  switch (item.type) {
    case 'reaction':
      return {
        icon: '🫧',
        text: `${who} ${many ? 'feiern' : 'feiert'} deine Putzaktion`,
      };
    case 'comment':
      return {
        icon: '💬',
        text: `${who} ${many ? 'haben' : 'hat'} deine Putzaktion kommentiert`,
      };
    case 'thread':
      return {
        icon: '🐟',
        text: `${who} ${many ? 'schwimmen' : 'schwimmt'} im selben Thread mit`,
      };
    default:
      return { icon: '🫧', text: `${who} war im Riff aktiv` };
  }
}
