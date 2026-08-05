import { useEffect, useState, useCallback } from 'react';
import { api, num } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import FeedCard from '../components/FeedCard.jsx';
import { Empty, Skeletons, XPBar, Avatar } from '../components/ui.jsx';

export default function Feed() {
  const { user, toast } = useApp();
  // Standard ist bewusst das große Riff: neue Leute sehen sofort Leben,
  // auch wenn ihre eigene WG noch still ist.
  const [scope, setScope] = useState('global');
  const [items, setItems] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pulse, setPulse] = useState(null);

  const load = useCallback(
    async (s) => {
      setItems(null);
      try {
        const d = await api.get(`/feed?scope=${s}`);
        setItems(d.items);
        setCursor(d.nextCursor);
      } catch (e) {
        toast(e.message, 'err');
        setItems([]);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(scope);
  }, [scope, load]);

  useEffect(() => {
    api.get('/leaderboard/pulse').then(setPulse).catch(() => {});
  }, []);

  const more = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await api.get(`/feed?scope=${scope}&cursor=${encodeURIComponent(cursor)}`);
      setItems((it) => [...it, ...d.items]);
      setCursor(d.nextCursor);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="screen">
      {user && <HeroCard user={user} pulse={pulse} />}

      <div className="segmented">
        <button className={scope === 'wg' ? 'on' : ''} onClick={() => setScope('wg')}>
          🪸 Meine WG
        </button>
        <button className={scope === 'global' ? 'on' : ''} onClick={() => setScope('global')}>
          🌍 Alle Riffe
        </button>
      </div>

      {items === null && <Skeletons n={3} height={190} />}

      {items?.length === 0 && scope === 'wg' && !user?.wg && (
        <Empty emoji="🪸" title="Du hast noch kein Riff" text="Tritt einer WG bei oder gründe deine eigene.">
          <button className="btn btn-primary" onClick={() => navigate('/wg')}>
            WG finden
          </button>
        </Empty>
      )}

      {items?.length === 0 && (user?.wg || scope === 'global') && (
        <Empty emoji="🫧" title="Noch ganz ruhig hier" text="Sei die erste Person, die etwas putzt.">
          <button className="btn btn-primary" onClick={() => navigate('/add')}>
            Aktivität eintragen
          </button>
        </Empty>
      )}

      {items?.map((item, i) => (
        <FeedCard
          key={item.id}
          item={item}
          index={i}
          onDeleted={(id) => setItems((it) => it.filter((x) => x.id !== id))}
        />
      ))}

      {cursor && (
        <button className="btn btn-block mt" onClick={more} disabled={loadingMore}>
          {loadingMore ? 'lädt …' : 'Tiefer tauchen ↓'}
        </button>
      )}
    </div>
  );
}

/* ---------- Persönliche Übersicht oben ---------- */
function HeroCard({ user, pulse }) {
  const r = user.rank;
  return (
    <div className="card card-hero" style={{ marginBottom: 14 }}>
      <div className="row">
        <Avatar fish={user.fish} color={user.color} size={54} level={r.level} onClick={() => navigate('/me')} />
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 17 }}>{user.displayName}</div>
          <div className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>
            {r.fish} {r.name}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--sand)' }}>{num(user.xp)}</div>
          <div className="faint" style={{ fontSize: 10.5, fontWeight: 800 }}>PUNKTE</div>
        </div>
      </div>

      <div className="mt">
        <XPBar progress={r.progress} />
        <div className="between" style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700 }}>
          <span className="faint">{r.nextName ? `Nächster Rang: ${r.nextName}` : 'Höchster Rang erreicht 👑'}</span>
          {r.nextName && <span className="muted">noch {num(r.toNext)}</span>}
        </div>
      </div>

      {pulse && (
        <div className="between mt" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)' }}>
          <span>🌊 Heute im Ozean: {pulse.actions24h} Aktionen</span>
          <span>⏱ {Math.round(pulse.minutes24h / 60)} Std. geschrubbt</span>
        </div>
      )}
    </div>
  );
}
