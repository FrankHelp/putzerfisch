/* ---------- Putzplan (Modul-Store) ----------
 * Winziger Singleton-Store außerhalb von React: Der Plan liegt in
 * localStorage und überlebt so Navigation und Neuladen – man kann
 * ihn über den Tag verteilt abarbeiten. Die Add-Seite (Auswahl)
 * und die Plan-View (Checkliste) hängen per usePlan() dran.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'putz:plan';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.items)) return null;
    return {
      mode: !!p.mode,
      items: p.items,
      done: p.done && typeof p.done === 'object' && !Array.isArray(p.done) ? p.done : {},
    };
  } catch {
    return null;
  }
}

let state = load() ?? { mode: false, items: [], done: {} };
const listeners = new Set();

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Speicher voll o. ä. – der Plan lebt dann nur im Speicher. */
  }
  listeners.forEach((cb) => cb(state));
}

export const getPlan = () => state;
export function subscribePlan(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePlan() {
  return useSyncExternalStore(subscribePlan, getPlan, getPlan);
}

/** Plan-Modus an/aus (die Auswahl bleibt beim Umschalten erhalten). */
export function setPlanMode(mode) {
  commit({ ...state, mode: !!mode });
}

/** Aktivität auf den Plan setzen oder wieder herunternehmen. */
export function togglePlanItem(a) {
  const has = state.items.some((x) => x.id === a.id);
  const items = has ? state.items.filter((x) => x.id !== a.id) : [...state.items, a];
  const done = { ...state.done };
  delete done[a.id];
  commit({ ...state, items, done });
}

/** Aktivität im Plan als erledigt markieren (nach erfolgreichem Log). */
export function markPlanDone(id, info) {
  commit({ ...state, done: { ...state.done, [id]: info } });
}

/** Plan komplett verwerfen (abgeschlossen oder abgebrochen). */
export function clearPlan() {
  commit({ mode: false, items: [], done: {} });
}
