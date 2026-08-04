import { useState } from 'react';
import { useApp } from '../state.jsx';

const FISH = ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦀', '🐢', '🐬', '🐳', '🪼', '🦭', '🐚'];
const COLORS = ['#2ee6d6', '#5ad1ff', '#a78bfa', '#f472b6', '#ffb45c', '#4ade80', '#fcd34d', '#fb7185'];

export default function Login() {
  const { login, register, toast } = useApp();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [fish, setFish] = useState('🐠');
  const [color, setColor] = useState('#2ee6d6');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        const u = await login(username.trim(), password);
        toast(`Willkommen zurück, ${u.displayName}! ${u.fish}`);
      } else {
        const u = await register({ username: username.trim(), displayName: displayName.trim(), password, fish, color });
        toast(`Ahoi ${u.displayName}! Dein Riff wartet. 🫧`);
      }
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ paddingTop: 'calc(var(--safe-t) + 40px)', paddingBottom: 40 }}>
      <div className="center" style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 68, filter: 'drop-shadow(0 0 26px rgba(46,230,214,.55))' }}>🐠</div>
        <h1 style={{ fontSize: 34, marginTop: 6 }}>Putzerfisch</h1>
        <p className="muted" style={{ fontWeight: 700, marginTop: 4 }}>
          Putzen ist ein Teamsport. Und ein Wettkampf.
        </p>
      </div>

      <div className="segmented">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')} type="button">
          Einloggen
        </button>
        <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')} type="button">
          Neu hier
        </button>
      </div>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Nutzername</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z. B. schrubbnala"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
          />
        </div>

        {mode === 'register' && (
          <div className="field">
            <label>Anzeigename</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Wie dich alle sehen"
              maxLength={24}
            />
          </div>
        )}

        <div className="field">
          <label>Passwort</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mindestens 6 Zeichen"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </div>

        {mode === 'register' && (
          <>
            <div className="field">
              <label>Dein Fisch</label>
              <div className="pick-grid">
                {FISH.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`pick ${fish === f ? 'on' : ''}`}
                    onClick={() => setFish(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Deine Farbe</label>
              <div className="pick-grid">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-pick ${color === c ? 'on' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <button className="btn btn-primary btn-block mt" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Abtauchen 🌊' : 'Riff betreten 🫧'}
        </button>
      </form>
    </div>
  );
}
