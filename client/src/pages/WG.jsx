import { useEffect, useState } from 'react';
import { api, num } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Avatar, Sheet, Skeletons } from '../components/ui.jsx';

const EMBLEMS = ['🪸', '🐚', '🌊', '⚓', '🏝️', '🦑', '🐳', '🧜', '🗿', '🫧', '🦞', '🐢'];

export default function WG() {
  const { user, setUser, toast } = useApp();
  const [data, setData] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'join'

  const load = () => {
    if (!user) return;
    setData(null);
    api.get('/wg/mine').then(setData).catch((e) => toast(e.message, 'err'));
  };

  useEffect(load, [user?.wg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const leave = async () => {
    if (!confirm('WG wirklich verlassen? Deine Punkte behältst du.')) return;
    try {
      const d = await api.post('/wg/leave');
      setUser(d.user);
      setData(null);
      toast('Du bist ausgezogen. 🧳');
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast('Code kopiert! 📋');
    } catch {
      toast('Konnte nicht kopieren – schreib ihn ab.', 'err');
    }
  };

  if (!user)
    return (
      <div className="screen">
        <h1 className="screen-title">Meine WG</h1>
        <p className="muted">Log dich ein, um einer WG beizutreten.</p>
      </div>
    );

  // --- Noch keine WG ---
  if (!user.wg)
    return (
      <div className="screen">
        <h1 className="screen-title">Dein Riff</h1>
        <p className="screen-sub">Zusammen putzt es sich leichter. Und mit mehr Schadenfreude.</p>

        <div className="card card-hero center" style={{ padding: 26 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🪸</div>
          <div style={{ fontWeight: 900, fontSize: 17 }}>Noch alleine unterwegs</div>
          <p className="muted" style={{ fontSize: 13.5, fontWeight: 600, margin: '6px 0 18px' }}>
            In einer WG bekommst du eine interne Rangliste, ein gemeinsames Riff und ihr tretet als Team in der
            WG-Liga an.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setMode('join')}>
            🔑 Mit Code beitreten
          </button>
          <button className="btn btn-block mt" onClick={() => setMode('create')}>
            ✨ Eigene WG gründen
          </button>
        </div>

        <p className="faint center mt-lg" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Ohne WG zählst du trotzdem im globalen Leaderboard mit.
        </p>

        <JoinSheet
          open={mode === 'join'}
          onClose={() => setMode(null)}
          onDone={(u) => {
            setUser(u);
            setMode(null);
            toast(`Willkommen bei ${u.wg.name}! ${u.wg.emblem}`);
          }}
        />
        <CreateSheet
          open={mode === 'create'}
          onClose={() => setMode(null)}
          onDone={(u) => {
            setUser(u);
            setMode(null);
            toast(`${u.wg.name} gegründet! Teile den Code. 🎉`);
          }}
        />
      </div>
    );

  // --- WG vorhanden ---
  if (!data) return <div className="screen"><Skeletons n={3} height={120} /></div>;

  const { wg, members, reef } = data;
  const totalXp = members.reduce((s, m) => s + m.xp, 0);

  return (
    <div className="screen">
      <div className="card card-hero center">
        <div style={{ fontSize: 46 }}>{wg.emblem}</div>
        <h1 style={{ fontSize: 23, marginTop: 4 }}>{wg.name}</h1>
        {wg.motto && (
          <p className="muted" style={{ fontSize: 13, fontStyle: 'italic', fontWeight: 600, marginTop: 4 }}>
            „{wg.motto}“
          </p>
        )}

        <div className="reef-meter" style={{ marginTop: 16, textAlign: 'left' }}>
          <div className="reef-head">
            <span>{reef.state.icon} Riff-Sauberkeit</span>
            <span style={{ color: reef.state.color }}>
              {reef.state.label} · {reef.score}%
            </span>
          </div>
          <div className="reef-bar">
            <i
              style={{
                width: `${reef.score}%`,
                background: `linear-gradient(90deg, ${reef.state.color}, ${reef.state.color}aa)`,
              }}
            />
          </div>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>
            {num(reef.points7d)} Punkte in den letzten 7 Tagen · {reef.members} Bewohner
          </div>
        </div>
      </div>

      <div className="section-title">Einladungscode</div>
      <div className="code-box" onClick={() => copyCode(wg.inviteCode)} style={{ cursor: 'pointer' }}>
        {wg.inviteCode}
      </div>
      <p className="faint center" style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>
        Tippen zum Kopieren
      </p>

      <div className="section-title">Bewohner ({members.length})</div>
      {members.map((m, i) => (
        <div key={m.id} className={`lb-row ${m.isMe ? 'me' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
          <Avatar fish={m.fish} color={m.color} size={40} level={m.level} onClick={() => navigate(`/user/${m.id}`)} />
          <div className="lb-main">
            <div className="lb-name">
              {m.displayName} {m.streak > 2 && <span>🔥{m.streak}</span>}
            </div>
            <div className="lb-sub">{m.rankName}</div>
          </div>
          <div className="lb-points">
            {totalXp ? Math.round((m.xp / totalXp) * 100) : 0}%
            <small>Anteil</small>
          </div>
        </div>
      ))}

      <button className="btn btn-block mt-lg" onClick={() => navigate('/board')}>
        🏆 Zur Rangliste
      </button>
      <button className="btn btn-block btn-danger mt" onClick={leave}>
        WG verlassen
      </button>
    </div>
  );
}

function JoinSheet({ open, onClose, onDone }) {
  const { toast } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post('/wg/join', { code: code.trim().toUpperCase() });
      onDone(d.user);
      setCode('');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="WG beitreten">
      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Einladungscode</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="z. B. RIFF23"
            maxLength={10}
            style={{ letterSpacing: '0.2em', fontWeight: 900, textAlign: 'center', fontSize: 20 }}
            autoCapitalize="characters"
            required
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>
          Beitreten
        </button>
      </form>
    </Sheet>
  );
}

function CreateSheet({ open, onClose, onDone }) {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [emblem, setEmblem] = useState('🪸');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post('/wg/create', { name: name.trim(), motto: motto.trim(), emblem });
      onDone(d.user);
      setName('');
      setMotto('');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="WG gründen">
      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Name der WG</label>
          <input
            className="input"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Korallenriff 3b"
            required
          />
        </div>
        <div className="field">
          <label>Wappen</label>
          <div className="pick-grid">
            {EMBLEMS.map((e) => (
              <button type="button" key={e} className={`pick ${emblem === e ? 'on' : ''}`} onClick={() => setEmblem(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Motto (optional)</label>
          <input
            className="input"
            value={motto}
            maxLength={80}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="Sauber ist ein Zustand, kein Zufall."
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy || !name.trim()}>
          Gründen 🎉
        </button>
      </form>
    </Sheet>
  );
}
