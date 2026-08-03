import { useEffect, useState } from 'react';
import { api, num, timeAgo } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Avatar, XPBar, Sheet, Skeletons, Empty } from '../components/ui.jsx';

const FISH = ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦀', '🐢', '🐬', '🐳', '🪼', '🦭', '🐚'];
const COLORS = ['#2ee6d6', '#5ad1ff', '#a78bfa', '#f472b6', '#ffb45c', '#4ade80', '#fcd34d', '#fb7185'];

export default function Profile({ userId }) {
  const { user: me, setUser, logout, toast } = useApp();
  const id = userId ?? me?.id;
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setData(null);
    api.get(`/users/${id}`).then(setData).catch((e) => toast(e.message, 'err'));
  }, [id, toast]);

  if (!id) return <Empty emoji="🐠" title="Nicht eingeloggt" />;
  if (!data) return <div className="screen"><Skeletons n={4} height={100} /></div>;

  const { user: u, stats, byCategory, history, badges, allBadges, recent } = data;
  const maxDay = Math.max(1, ...history.map((h) => h.points));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.points));
  const earnedCodes = new Set(badges.map((b) => b.code));

  return (
    <div className="screen">
      <div className="card card-hero">
        <div className="row">
          <Avatar fish={u.fish} color={u.color} size={64} level={u.rank.level} />
          <div className="grow">
            <div style={{ fontWeight: 900, fontSize: 20 }}>{u.displayName}</div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {u.rank.fish} {u.rank.name}
            </div>
            {u.wg && (
              <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                {u.wg.emblem} {u.wg.name}
              </div>
            )}
          </div>
          {u.isMe && (
            <button className="btn btn-sm" onClick={() => setEditing(true)}>
              ✏️
            </button>
          )}
        </div>

        <div className="mt">
          <XPBar progress={u.rank.progress} />
          <div className="between" style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700 }}>
            <span className="faint">{num(u.xp)} Punkte</span>
            {u.rank.nextName && <span className="muted">noch {num(u.rank.toNext)} bis {u.rank.nextName}</span>}
          </div>
        </div>

        <p className="faint center" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 10, marginBottom: 0 }}>
          „{u.rank.blurb}“
        </p>
      </div>

      <div className="stat-grid mt">
        <div className="stat">
          <div className="v">#{stats.globalRank}</div>
          <div className="k">GLOBAL</div>
        </div>
        <div className="stat">
          <div className="v">{num(stats.actions)}</div>
          <div className="k">AKTIONEN</div>
        </div>
        <div className="stat">
          <div className="v">{Math.round(stats.minutes / 60)}h</div>
          <div className="k">GESCHRUBBT</div>
        </div>
      </div>

      <div className="stat-grid mt">
        <div className="stat">
          <div className="v">🔥 {u.streak}</div>
          <div className="k">SERIE</div>
        </div>
        <div className="stat">
          <div className="v">🏅 {u.bestStreak}</div>
          <div className="k">REKORD</div>
        </div>
        <div className="stat">
          <div className="v">{badges.length}</div>
          <div className="k">ABZEICHEN</div>
        </div>
      </div>

      <div className="section-title">Letzte 14 Tage</div>
      <div className="card card-tight">
        <div className="spark">
          {history.map((h) => (
            <i key={h.day} style={{ height: `${(h.points / maxDay) * 100}%` }} title={`${h.day}: ${h.points} P`} />
          ))}
        </div>
      </div>

      {stats.favourite && (
        <div className="card card-tight mt">
          <div className="row">
            <span style={{ fontSize: 26 }}>{stats.favourite.icon}</span>
            <div className="grow">
              <div className="faint" style={{ fontSize: 11, fontWeight: 800 }}>LIEBLINGSAUFGABE</div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{stats.favourite.name}</div>
            </div>
            <span className="pts">{stats.favourite.count}×</span>
          </div>
        </div>
      )}

      <div className="section-title">Zonen-Verteilung</div>
      <div className="card card-tight">
        {byCategory.filter((c) => c.points > 0).length === 0 && (
          <div className="faint center" style={{ fontSize: 13, padding: 8 }}>Noch nichts geputzt.</div>
        )}
        {byCategory
          .filter((c) => c.points > 0)
          .map((c) => (
            <div key={c.id} className="cat-bar">
              <span style={{ width: 22 }}>{c.icon}</span>
              <div className="track">
                <i style={{ width: `${(c.points / maxCat) * 100}%`, background: c.color }} />
              </div>
              <span className="faint" style={{ fontSize: 11, minWidth: 46, textAlign: 'right' }}>
                {num(c.points)} P
              </span>
            </div>
          ))}
      </div>

      <div className="section-title">
        Abzeichen ({badges.length}/{Object.keys(allBadges).length})
      </div>
      <div className="badge-grid">
        {Object.entries(allBadges).map(([code, b]) => (
          <div key={code} className={`badge-tile ${earnedCodes.has(code) ? '' : 'locked'}`} title={b.desc}>
            <span className="bi">{b.icon}</span>
            <span className="bn">{b.name}</span>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <div className="section-title">Zuletzt erledigt</div>
          {recent.map((r) => (
            <div key={r.id} className="act-row" style={{ animation: 'none' }}>
              <span className="ic">{r.icon}</span>
              <span className="grow">
                <span className="nm">{r.name}</span>
                <span className="sub">{timeAgo(r.createdAt)}</span>
              </span>
              <span className="pts">+{r.points}</span>
            </div>
          ))}
        </>
      )}

      {u.isMe && (
        <>
          <div className="section-title">Riff</div>
          <button className="btn btn-block" onClick={() => navigate('/wg')}>
            {me?.wg ? `${me.wg.emblem} ${me.wg.name} verwalten` : '🪸 WG beitreten oder gründen'}
          </button>
          <button className="btn btn-block btn-danger mt" onClick={logout}>
            Auftauchen (ausloggen)
          </button>
        </>
      )}

      {!u.isMe && (
        <button className="btn btn-block mt-lg" onClick={() => navigate('/board')}>
          ← Zur Rangliste
        </button>
      )}

      <EditSheet
        open={editing}
        onClose={() => setEditing(false)}
        me={me}
        onSaved={(nu) => {
          setUser(nu);
          setData((d) => ({ ...d, user: { ...d.user, displayName: nu.displayName, fish: nu.fish, color: nu.color } }));
        }}
      />
    </div>
  );
}

function EditSheet({ open, onClose, me, onSaved }) {
  const { toast } = useApp();
  const [displayName, setDisplayName] = useState(me?.displayName ?? '');
  const [fish, setFish] = useState(me?.fish ?? '🐠');
  const [color, setColor] = useState(me?.color ?? '#2ee6d6');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && me) {
      setDisplayName(me.displayName);
      setFish(me.fish);
      setColor(me.color);
    }
  }, [open, me]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.patch('/auth/me', { displayName: displayName.trim(), fish, color });
      onSaved(d.user);
      toast('Gespeichert. Schick siehst du aus. ✨');
      onClose();
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Profil anpassen">
      <form onSubmit={save} style={{ marginTop: 12 }}>
        <div className="center" style={{ marginBottom: 14 }}>
          <Avatar fish={fish} color={color} size={76} />
        </div>
        <div className="field">
          <label>Anzeigename</label>
          <input
            className="input"
            value={displayName}
            maxLength={24}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Fisch</label>
          <div className="pick-grid">
            {FISH.map((f) => (
              <button type="button" key={f} className={`pick ${fish === f ? 'on' : ''}`} onClick={() => setFish(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Farbe</label>
          <div className="pick-grid">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-pick ${color === c ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          Speichern
        </button>
      </form>
    </Sheet>
  );
}
