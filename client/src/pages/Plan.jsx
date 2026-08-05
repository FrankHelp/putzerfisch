import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../state.jsx';
import { usePlan, markPlanDone, clearPlan, setPlanMode, removePlanItem } from '../plan.js';
import { navigate } from '../router.jsx';
import { Empty, Confetti } from '../components/ui.jsx';
import { haptic } from '../haptics.js';

/* ---------- Putzplan: die vorbereitete Checkliste ----------
 * Jede Aktivität wird per Checkbox abgeschlossen – das logged sie
 * sofort (Punkte gibt's direkt). "Plan abschließen" beendet den
 * Plan, "Abbrechen" verwirft den Rest. Erledigte Einträge bleiben
 * natürlich bestehen – die sind ja wirklich geputzt.
 */
export default function Plan() {
  const { setUser, toast } = useApp();
  const plan = usePlan();
  const [categories, setCategories] = useState([]);
  const [working, setWorking] = useState({}); // id -> gerade am Loggen
  const [celebrate, setCelebrate] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    api.get('/activities/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // Wer den Plan-Reiter öffnet, will sammeln – nicht sofort eintragen.
  // Also Plan-Modus an: ein Tipp auf der Auswahlseite landet dann hier,
  // statt direkt geloggt zu werden. clearPlan() schaltet ihn am Ende wieder aus.
  useEffect(() => {
    setPlanMode(true);
  }, []);

  const items = plan.items;
  const doneCount = items.reduce((n, x) => n + (plan.done[x.id] ? 1 : 0), 0);
  const allDone = items.length > 0 && doneCount === items.length;
  const totalPts = items.reduce((s, x) => s + (plan.done[x.id]?.points ?? 0), 0);
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // Kurzer Konfetti-Burst, sobald der letzte Punkt abgehakt ist.
  useEffect(() => {
    if (!allDone) {
      setCelebrate(false);
      return;
    }
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 3200);
    return () => clearTimeout(t);
  }, [allDone]);

  const complete = async (a) => {
    if (plan.done[a.id] || working[a.id]) return;
    setWorking((w) => ({ ...w, [a.id]: true }));
    try {
      const d = await api.post('/activities/log', { activityId: a.id });
      setUser(d.user);
      markPlanDone(a.id, { points: d.points });
      haptic('success'); // Aufgabe abgehakt = Punkte kassiert
      toast(`${a.icon} ${a.name} erledigt — +${d.points} Punkte 🫧`);
      if (d.leveledUp) toast(`🏆 Neuer Rang: ${d.leveledUp.name}`);
      (d.newBadges ?? []).forEach((b) => toast(`${b.icon} Badge: ${b.name}`));
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setWorking((w) => {
        const n = { ...w };
        delete n[a.id];
        return n;
      });
    }
  };

  const drop = (a) => {
    removePlanItem(a.id);
    haptic('danger'); // wie beim Zurücknehmen: es wird etwas entfernt
    toast(`${a.icon} ${a.name} vom Plan genommen`);
  };

  const leave = (to, msg) => {
    setClosing(true);
    clearPlan();
    if (msg) toast(msg);
    navigate(to);
  };

  if (closing) return <div className="screen" />;

  return (
    <div className="screen">
      {celebrate && allDone && <Confetti count={20} />}
      <h1 className="screen-title">Dein Putzplan</h1>
      <p className="screen-sub">
        {allDone ? 'Alles erledigt – stark! 🎉' : 'Hak ab, was du geschafft hast – Punkte gibt’s sofort.'}
      </p>

      {items.length === 0 ? (
        <Empty emoji="📋" title="Kein Plan" text="Stöber im Riff und setz dir ein paar Aufgaben auf den Plan.">
          <button className="btn btn-primary" onClick={() => navigate('/add')}>
            Aufgaben wählen
          </button>
        </Empty>
      ) : (
        <>
          <div className="plan-progress">
            <div className="between" style={{ fontSize: 13, fontWeight: 800 }}>
              <span className="muted">Fortschritt</span>
              <span style={{ color: 'var(--cyan)' }}>
                {doneCount}/{items.length} erledigt
              </span>
            </div>
            <div className="plan-bar">
              <i style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }} />
            </div>
          </div>

          {items.map((a) => {
            const done = !!plan.done[a.id];
            const busy = !!working[a.id];
            return (
              // Zeile ist ein Container statt eines Buttons: das Abhaken und das
              // Herunternehmen sind zwei Aktionen, verschachtelte Buttons wären ungültig.
              <div key={a.id} className={`act-row plan-item ${done ? 'done' : ''}`}>
                <button className="plan-main" onClick={() => complete(a)} disabled={busy || done}>
                  <span className={`plan-check ${done ? 'on' : ''}`}>{done ? '✓' : busy ? '…' : ''}</span>
                  <span className="ic">{a.icon}</span>
                  <span className="grow">
                    <span className="nm">{a.name}</span>
                    <span className="sub">
                      {catById[a.category]?.label ?? a.category} · ca. {a.minutes} Min.
                    </span>
                  </span>
                  <span className="pts">{done ? `+${plan.done[a.id].points} P` : `${a.points} P`}</span>
                </button>

                {/* Erledigtes bleibt stehen – die Punkte sind ja schon vergeben. */}
                {!done && (
                  <button
                    className="plan-remove"
                    onClick={() => drop(a)}
                    disabled={busy}
                    title="Vom Plan nehmen"
                    aria-label={`${a.name} vom Plan nehmen`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {totalPts > 0 && (
            <p className="faint center mt" style={{ fontSize: 12.5, fontWeight: 700 }}>
              Schon eingesammelt: <b style={{ color: 'var(--sand)' }}>+{totalPts} Punkte</b>
            </p>
          )}

          <div className="plan-actions">
            <button className="btn btn-ghost" onClick={() => leave('/add', 'Plan verworfen ↩')}>
              Abbrechen
            </button>
            <button
              className="btn btn-primary"
              onClick={() => leave('/feed', totalPts > 0 ? `Plan geschafft – +${totalPts} Punkte gesammelt 🎉` : 'Plan abgeschlossen 🎉')}
              disabled={!allDone}
            >
              {allDone ? 'Plan abschließen 🎉' : `Noch ${items.length - doneCount} offen`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
