import { useEffect, useState } from 'react';
import { api, timeAgo } from '../api.js';
import { useApp } from '../state.jsx';
import { Sheet, Avatar, Empty, Skeletons, Confetti } from '../components/ui.jsx';
import { haptic } from '../haptics.js';

const ICONS = ['🧽', '🧼', '🪣', '🧹', '🚿', '🪟', '🧴', '🗑️', '👕', '🍽️', '🛏️', '🪴', '🕸️', '💡', '🚪', '❄️', '🔥', '✨'];

export default function Ideas() {
  const { user, toast } = useApp();
  const [status, setStatus] = useState('open');
  const [sort, setSort] = useState('top');
  const [data, setData] = useState(null);
  const [composing, setComposing] = useState(false);
  const [party, setParty] = useState(false);

  const load = () => {
    setData(null);
    api
      .get(`/suggestions?status=${status}&sort=${sort}`)
      .then(setData)
      .catch((e) => {
        toast(e.message, 'err');
        setData({ suggestions: [] });
      });
  };

  useEffect(load, [status, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const vote = async (s) => {
    if (!user) return toast('Log dich ein, um abzustimmen.', 'err');
    try {
      const d = await api.post(`/suggestions/${s.id}/vote`);
      haptic('success'); // Belohnung fürs Abstimmen
      if (d.promoted) {
        setParty(true);
        setTimeout(() => setParty(false), 3400);
        toast(`🎉 „${s.name}“ ist jetzt offiziell im Katalog!`);
        setData((cur) => ({ ...cur, suggestions: cur.suggestions.filter((x) => x.id !== s.id) }));
      } else {
        setData((cur) => ({
          ...cur,
          suggestions: cur.suggestions.map((x) => (x.id === s.id ? d.suggestion : x)),
        }));
      }
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const remove = async (s) => {
    if (!confirm('Vorschlag zurückziehen?')) return;
    try {
      await api.del(`/suggestions/${s.id}`);
      setData((cur) => ({ ...cur, suggestions: cur.suggestions.filter((x) => x.id !== s.id) }));
      toast('Vorschlag zurückgezogen.');
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  return (
    <div className="screen">
      {party && <Confetti pieces={['🎉', '✨', '🫧', '💡', '⭐']} count={30} />}

      <h1 className="screen-title">Ideen-Riff</h1>
      <p className="screen-sub">
        Schlag neue Aktivitäten vor. Die dumme Seekuh prüft jede Idee – ab {data?.threshold ?? 10} Stimmen
        wandern sie in den Katalog.
      </p>

      <button className="btn btn-coral btn-block" onClick={() => (user ? setComposing(true) : toast('Erst einloggen.', 'err'))}>
        💡 Neue Aktivität vorschlagen
      </button>

      <div className="segmented mt-lg">
        <button className={status === 'open' ? 'on' : ''} onClick={() => setStatus('open')}>
          Zur Abstimmung
        </button>
        <button className={status === 'approved' ? 'on' : ''} onClick={() => setStatus('approved')}>
          Angenommen ✅
        </button>
      </div>

      {status === 'open' && (
        <div className="chips">
          <button className={`chip ${sort === 'top' ? 'on' : ''}`} onClick={() => setSort('top')}>
            🔝 Beliebteste
          </button>
          <button className={`chip ${sort === 'new' ? 'on' : ''}`} onClick={() => setSort('new')}>
            🆕 Neueste
          </button>
        </div>
      )}

      {data === null && <Skeletons n={4} height={110} />}

      {data?.suggestions.length === 0 && (
        <Empty
          emoji="💡"
          title={status === 'open' ? 'Keine offenen Vorschläge' : 'Noch nichts angenommen'}
          text={status === 'open' ? 'Sei die erste Person mit einer Idee.' : 'Stimmt fleißig ab!'}
        />
      )}

      {data?.suggestions.map((s, i) => (
        <div key={s.id} className="sugg" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <button
            className={`vote-big ${s.voted ? 'on' : ''}`}
            onClick={() => vote(s)}
            disabled={status !== 'open'}
          >
            <span className="up">▲</span>
            <span className="cnt">{s.votes}</span>
            <span className="of">von {s.threshold}</span>
          </button>

          <div className="body">
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span className="nm grow">{s.name}</span>
              <span className="pts">{s.points} P</span>
            </div>

            {s.description && <div className="desc">{s.description}</div>}

            {status === 'open' && (
              <div className="progress-thin">
                <i style={{ width: `${Math.min(100, (s.votes / s.threshold) * 100)}%` }} />
              </div>
            )}

            <div className="meta">
              {s.author && (
                <>
                  <Avatar fish={s.author.fish} color={s.author.color} size={18} />
                  <span>{s.author.displayName}</span>
                  <span>·</span>
                </>
              )}
              <span>{timeAgo(s.createdAt)}</span>
              <span>·</span>
              <span>{s.minutes} Min.</span>
              {status === 'open' && s.needed > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--cyan)' }}>noch {s.needed} Stimmen</span>
                </>
              )}
              {s.isMine && status === 'open' && (
                <button className="link" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => remove(s)}>
                  zurückziehen
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <Compose open={composing} onClose={() => setComposing(false)} onCreated={load} />
    </div>
  );
}

/* ---------- Formular für neue Vorschläge ---------- */
function Compose({ open, onClose, onCreated }) {
  const { toast } = useApp();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('kombuese');
  const [icon, setIcon] = useState('🧽');
  const [points, setPoints] = useState(15);
  const [minutes, setMinutes] = useState(10);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [scRejected, setScRejected] = useState(null); // { message, fails, maxFails }
  const [cooldown, setCooldown] = useState(0); // Sekunden bis zum nächsten Versuch

  useEffect(() => {
    if (open && !categories.length)
      api.get('/activities/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, [open, categories.length]);

  // Countdown für das Seekuh-Rate-Limit (nach 3 Fehlversuchen: 1 Versuch alle 30 s)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true);
    setScRejected(null);
    try {
      await api.post('/suggestions', { name: name.trim(), category, icon, points, minutes, description });
      haptic('success');
      toast('Die Seekuh nickt: Deine Idee ist in der Abstimmung! 🦭 Deine Stimme zählt schon.');
      setName('');
      setDescription('');
      onClose();
      onCreated();
    } catch (err) {
      if (err.status === 422) {
        haptic('warning');
        setScRejected({ message: err.message, fails: err.fails ?? 3, maxFails: err.maxFails ?? 3 });
      } else if (err.status === 429) {
        haptic('error');
        setScRejected(null);
        setCooldown(err.retryAfter || 30);
      } else {
        toast(err.message, 'err');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Neue Aktivität vorschlagen">
      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <div className="field">
          <label>Name der Aktivität</label>
          <input
            className="input"
            value={name}
            maxLength={60}
            onChange={(e) => {
              setName(e.target.value);
              if (scRejected) setScRejected(null); // neuer Versuch, neue Chance
            }}
            placeholder="z. B. Duschvorhang waschen"
            required
          />
        </div>

        <div className="field">
          <label>Zone</label>
          <div className="chips" style={{ marginBottom: 0 }}>
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`chip ${category === c.id ? 'on' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Symbol</label>
          <div className="pick-grid">
            {ICONS.map((ic) => (
              <button
                type="button"
                key={ic}
                className={`pick ${icon === ic ? 'on' : ''}`}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>
            Punkte: <b style={{ color: 'var(--sand)' }}>{points}</b>
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="1"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--cyan)' }}
          />
          <div className="faint" style={{ fontSize: 11, fontWeight: 700 }}>
            Zum Vergleich: Müll rausbringen 12 · Klo putzen 30 · Großputz 80
          </div>
        </div>

        <div className="field">
          <label>
            Dauer: <b style={{ color: 'var(--cyan)' }}>{minutes} Min.</b>
          </label>
          <input
            type="range"
            min="1"
            max="120"
            step="1"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--cyan)' }}
          />
        </div>

        <div className="field">
          <label>Warum? (optional)</label>
          <textarea
            className="input"
            value={description}
            maxLength={300}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Überzeug die anderen …"
          />
        </div>

        {busy && (
          <div className="seacow sc-check">
            <span className="sc-emoji">🦭</span>
            <div>
              <b>Die dumme Seekuh prüft …</b>
              <p>Ob deine Idee wirklich ins Riff darf.</p>
            </div>
          </div>
        )}

        {scRejected && (
          <div className="seacow sc-no">
            <span className="sc-emoji">🦭</span>
            <div>
              <b>Die dumme Seekuh schüttelt den Kopf</b>
              <p>{scRejected.message}</p>
              <p className="sc-hint">
                {scRejected.fails >= scRejected.maxFails
                  ? `Versuch ${scRejected.fails}/${scRejected.maxFails} – jetzt macht sie erstmal Pause.`
                  : `Versuch ${scRejected.fails}/${scRejected.maxFails} – danach macht sie Pause.`}
              </p>
            </div>
          </div>
        )}

        {cooldown > 0 && (
          <div className="seacow sc-pause">
            <span className="sc-emoji">🦭</span>
            <div>
              <b>Die dumme Seekuh verdaut</b>
              <p>
                Zu viele verrückte Ideen auf einmal. Nächster Versuch in <b>{cooldown} s</b>.
              </p>
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={busy || !name.trim() || cooldown > 0}>
          {busy ? 'Die Seekuh prüft …' : cooldown > 0 ? `Warte ${cooldown} s …` : 'Zur Abstimmung stellen'}
        </button>
      </form>
    </Sheet>
  );
}
