import { useEffect, useState, useMemo, useRef } from 'react';
import { api, num } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Sheet, Empty, Skeletons, Confetti, CountUp } from '../components/ui.jsx';
import { compressToJpegDataUrl } from '../photo.js';
import { usePlan, setPlanMode, togglePlanItem } from '../plan.js';

export default function Add() {
  const { user, setUser, toast } = useApp();
  const plan = usePlan();
  const planMode = plan.mode;
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    api.get('/activities/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // Suche (entprellt) bzw. Kategorie-Liste
  useEffect(() => {
    const q = query.trim();
    if (!q && !activeCat) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setResults(null);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (activeCat) params.set('category', activeCat);
      api
        .get(`/activities?${params}`)
        .then((d) => !cancelled && setResults(d.activities))
        .catch(() => !cancelled && setResults([]));
    }, q ? 220 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, activeCat]);

  const openActivity = async (a) => {
    setSelected(a);
    setNote('');
    setPhoto(null);
    setPreview(null);
    try {
      setPreview(await api.get(`/activities/${a.id}/preview`));
    } catch {
      setPreview({ points: a.points, basePoints: a.points, bonuses: [] });
    }
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // erlaubt, dieselbe Datei erneut zu wählen
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Bitte ein Bild wählen.', 'err');
    try {
      setPhoto(await compressToJpegDataUrl(file));
    } catch {
      toast('Foto konnte nicht gelesen werden.', 'err');
    }
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const d = await api.post('/activities/log', { activityId: selected.id, note, photo: photo || undefined });
      setUser(d.user);
      setSelected(null);
      setPhoto(null);
      setCelebration({ ...d, activity: selected });
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const undoLast = async () => {
    try {
      const res = await api.del(`/activities/log/${celebration.logId}`);
      setUser(res.user);
      toast('Eintrag zurückgenommen ↩');
      setCelebration(null);
      navigate('/feed');
    } catch (e) {
      toast(e.message, 'err');
      throw e;
    }
  };

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const browsing = query.trim() || activeCat;
  const picked = useMemo(() => new Set(plan.items.map((x) => x.id)), [plan.items]);

  const onTogglePlan = () => {
    setPlanMode(!planMode);
    if (planMode) toast('Plan-Modus aus – Auswahl bleibt erhalten.');
    else toast('Plan-Modus an – antippen sammelt Aufgaben 📋');
  };

  if (celebration)
    return (
      <Celebration
        data={celebration}
        onDone={() => {
          setCelebration(null);
          navigate('/feed');
        }}
        onUndo={undoLast}
      />
    );

  return (
    <div className="screen">
      <div className="add-head">
        <h1 className="screen-title">{planMode ? 'Was gehst du heute an?' : 'Was hast du geschafft?'}</h1>
        <button
          className={`plan-toggle ${planMode ? 'on' : ''}`}
          onClick={onTogglePlan}
          aria-pressed={planMode}
          title={planMode ? 'Plan-Modus aus' : 'Plan-Modus an'}
        >
          <span className="ic">📋</span>
          <span>Plan{plan.items.length > 0 ? ` · ${plan.items.length}` : ''}</span>
        </button>
      </div>
      <p className="screen-sub">
        {planMode
          ? 'Such danach oder wähl eine Zone im Riff – was du antippst, wandert auf den Plan.'
          : 'Such danach oder wähl eine Zone im Riff.'}
      </p>

      <div className="search-wrap" style={{ marginBottom: 14 }}>
        <span className="icon">🔍</span>
        <input
          className="input"
          placeholder="Abwasch, Klo, Müll …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="none"
        />
        {query && (
          <button className="clear" onClick={() => setQuery('')} aria-label="Suche leeren">
            ×
          </button>
        )}
      </div>

      {activeCat && (
        <div className="chips">
          <button className="chip on" onClick={() => setActiveCat(null)}>
            ← {catById[activeCat]?.icon} {catById[activeCat]?.label}
          </button>
        </div>
      )}

      {!browsing && (
        <>
          <div className="section-title">Zonen im Riff</div>
          <div className="cat-grid">
            {categories.map((c) => (
              <button key={c.id} className="cat-tile" style={{ '--c': c.color }} onClick={() => setActiveCat(c.id)}>
                <span className="ic">{c.icon}</span>
                <span className="lb">{c.label}</span>
                <span className="hint">{c.hint}</span>
              </button>
            ))}
          </div>
          <p className="faint center mt-lg" style={{ fontSize: 12.5, fontWeight: 600 }}>
            Fehlt was? <span className="link" onClick={() => navigate('/ideas')}>Schlag es vor →</span>
          </p>
        </>
      )}

      {browsing && results === null && <Skeletons n={5} height={62} />}

      {browsing && results?.length === 0 && (
        <Empty emoji="🔍" title="Nichts gefunden" text="Vielleicht ist es Zeit für einen neuen Vorschlag.">
          <button className="btn btn-primary" onClick={() => navigate('/ideas')}>
            Aktivität vorschlagen
          </button>
        </Empty>
      )}

      {browsing &&
        results?.map((a, i) => {
          const isPicked = picked.has(a.id);
          return (
            <button
              key={a.id}
              className={`act-row ${planMode ? 'plan-pick' : ''} ${isPicked ? 'picked' : ''}`}
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
              onClick={() => (planMode ? togglePlanItem(a) : openActivity(a))}
            >
              {planMode && <span className={`plan-check ${isPicked ? 'on' : ''}`}>{isPicked ? '✓' : ''}</span>}
              <span className="ic">{a.icon}</span>
              <span className="grow">
                <span className="nm">
                  {a.name} {a.communityMade && '✨'}
                </span>
                <span className="sub">
                  {catById[a.category]?.label ?? a.category} · {a.minutes} Min.
                </span>
              </span>
              <span className="pts">{a.points} P</span>
            </button>
          );
        })}

      {/* Bestätigungs-Sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <>
            <div className="row" style={{ margin: '10px 0 14px' }}>
              <span style={{ fontSize: 44 }}>{selected.icon}</span>
              <div className="grow">
                <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
                  {catById[selected.category]?.icon} {catById[selected.category]?.label} · ca. {selected.minutes} Min.
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
                  Basis: <b style={{ color: 'var(--sand)' }}>{selected.points} Punkte</b>
                </div>
              </div>
            </div>

            {preview?.bonuses?.length > 0 && (
              <div className="card card-tight" style={{ marginBottom: 12 }}>
                <div className="section-title" style={{ margin: '0 0 8px' }}>Deine Boni gerade</div>
                {preview.bonuses.map((b, i) => (
                  <div key={i} className="between" style={{ fontSize: 13.5, fontWeight: 700, padding: '3px 0' }}>
                    <span>
                      {b.icon} {b.label}
                    </span>
                    <span style={{ color: 'var(--cyan)' }}>{b.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="field">
              <label>Notiz (optional)</label>
              <textarea
                className="input"
                value={note}
                maxLength={240}
                onChange={(e) => setNote(e.target.value)}
                placeholder="War schlimmer als erwartet …"
              />
            </div>

            {photo ? (
              <div className="photo-preview-wrap">
                <img className="photo-preview" src={photo} alt="Vorschau" />
                <div>
                  <button className="c-time link" onClick={() => setPhoto(null)}>Foto entfernen</button>
                </div>
              </div>
            ) : (
              <button className="photo-pick" onClick={() => photoInputRef.current?.click()}>
                📷 Foto (optional)
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />

            <button className="btn btn-primary btn-block" onClick={confirm} disabled={saving}>
              {saving ? '…' : `Erledigt — ${preview ? `+${preview.points}` : `+${selected.points}`} Punkte kassieren 🫧`}
            </button>
            <button className="btn btn-ghost btn-block mt" onClick={() => setSelected(null)}>
              Abbrechen
            </button>
          </>
        )}
      </Sheet>

      {planMode && plan.items.length > 0 && (
        <button className="plan-fab" onClick={() => navigate('/plan')}>
          <span>📋 Plan starten</span>
          <span className="count">{plan.items.length}</span>
        </button>
      )}
    </div>
  );
}

/* ---------- Erfolgs-Feier ---------- */
function Celebration({ data, onDone, onUndo }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [undoing, setUndoing] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(t);
  }, []);

  const undo = async () => {
    setUndoing(true);
    try {
      await onUndo();
    } catch {
      setUndoing(false);
    }
  };

  return (
    <div className="splash">
      {showConfetti && <Confetti />}
      <div>
        <div className="ring">{data.activity.icon}</div>
        <div className="gain">
          +<CountUp to={data.points} />
        </div>
        <div className="headline">{data.activity.name}</div>
        <div className="sub">
          Basis {data.basePoints} P
          {data.bonuses.length > 0 && ` · ${data.bonuses.length} Bonus${data.bonuses.length > 1 ? 'se' : ''}`}
        </div>

        {data.bonuses.length > 0 && (
          <div className="bonus-row" style={{ justifyContent: 'center', marginTop: 14 }}>
            {data.bonuses.map((b, i) => (
              <span key={i} className="bonus-tag">
                {b.icon} {b.label} {b.value}
              </span>
            ))}
          </div>
        )}

        {data.streak > 1 && (
          <div className="streak-chip" style={{ marginTop: 14 }}>
            🔥 {data.streak} Tage Serie
          </div>
        )}

        {data.leveledUp && (
          <div className="levelup">
            <div className="lu-title">Neuer Rang</div>
            <div className="lu-name">
              {data.leveledUp.fish} {data.leveledUp.name}
            </div>
            <div className="sub" style={{ marginTop: 3 }}>{data.leveledUp.blurb}</div>
          </div>
        )}

        {data.newBadges?.map((b) => (
          <div key={b.code} className="badge-pop">
            <span style={{ fontSize: 24 }}>{b.icon}</span>
            <span>
              <b>{b.name}</b>
              <div className="sub" style={{ fontSize: 12 }}>{b.desc}</div>
            </span>
          </div>
        ))}

        <div className="mt-lg">
          <div className="muted" style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Gesamt: {num(data.user.xp)} Punkte
          </div>
          <button className="btn btn-primary" onClick={onDone}>
            Weiter zum Feed →
          </button>
          <div className="center" style={{ marginTop: 4 }}>
            <button className="link-btn" onClick={undo} disabled={undoing}>
              {undoing ? '…' : '↩ Rückgängig'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
