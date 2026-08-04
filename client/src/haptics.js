/* ---------- Haptic-Manager: Vibration (Android) + Taptic Engine (iOS) ----------
 * Läuft bewusst UNABHÄNGIG vom Sound-Master-Schalter (putz:sound): Haptik
 * soll auch bei ausgeschaltetem Sound funktionieren.
 *
 * Design: Nur zwei Intents – Belohnung/Erfolg (1 Tick) und Gefahr (2 Ticks).
 * Alles andere (Navigation, Toggles, Auswahl-Chips, normale Buttons) bleibt
 * bewusst still.
 *
 * Android/Chrome: navigator.vibrate(ms-Muster).
 * iOS (Safari): navigator.vibrate gibt es nicht. Trick aus "web-haptics":
 * Ein verstecktes <input type="checkbox" switch> wird per Label-Klick
 * getoggelt – Safari (17.4+) stößt dabei jedes Mal die Taptic Engine an.
 * Kein Ton, nur Haptik. (Hinweis: Der System-Stummschalter des iPhones
 * unterdrückt das Taptic-Feedback – das können Web-Apps nicht beeinflussen.)
 */

const TICK_GAP = 90; // ms – Abstand zwischen einzelnen iOS-Ticks

let iosSwitch = null; // { label } – lazy erzeugt

/* Ein Taptic-Tick auf iOS: den versteckten Switch einmal toggeln. */
function iosTick() {
  if (!iosSwitch) {
    try {
      const id = `putz-haptic-${Math.random().toString(36).slice(2, 8)}`;
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.style.display = 'none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.id = id;
      input.style.all = 'initial';
      input.style.appearance = 'auto';
      input.style.display = 'none';
      label.appendChild(input);
      document.body.appendChild(label);
      iosSwitch = label;
    } catch {
      return; // kein DOM/Fehler → Haptik still ignorieren
    }
  }
  try {
    iosSwitch.click();
  } catch {}
}

/* Muster: vibrate = ms-Muster für navigator.vibrate, ticks = iOS-Ticks.
 * Belohnung/Erfolg = 1 Tick (kurzer Puls), Gefahr = 2 Ticks (Doppel-Puls). */
const PATTERNS = {
  success: { vibrate: [15],            ticks: 1 },
  danger:  { vibrate: [0, 40, 60, 40], ticks: 2 },
};

export function haptic(name = 'success') {
  const p = PATTERNS[name] ?? PATTERNS.success;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(p.vibrate);
    } catch {}
    return;
  }
  for (let i = 0; i < p.ticks; i++) setTimeout(iosTick, i * TICK_GAP);
}

/* ---------- Globale Verdrahtung ----------
 * Nur Element-Klassen ohne eigene Handler-Logik: Gefahren-Buttons, die
 * Plan-Auswahl in „Eintragen" und Riffpost-Karten. Alle anderen Momente
 * (Votes, Reaktionen, Kommentar senden, Erfolge, Rücknahmen) feuern
 * programmatisch direkt in den Komponenten.
 *
 * Android feuert direkt beim Drücken (pointerdown), damit es sich sofort
 * anfühlt. iOS feuert erst im click-Event: Beim pointerdown ist die Geste
 * noch nicht bestätigt (es könnte ein Scroll werden) – Safari unterdrückt
 * den Taptic-Tick dann. Erst der bestätigte Tap (click) tickt zuverlässig. */

const INTERACTIVE = '.btn-danger, .act-row.plan-pick, .notif';

const hasVibrate = typeof navigator !== 'undefined' && !!navigator.vibrate;

/* Welches Muster passt zu welchem Element? */
function hapticFor(el) {
  return el.matches('.btn-danger') ? 'danger' : 'success';
}

let inited = false;
let lastPointer = null; // { el, at } – verhindert Doppel-Feedback (Android)

function onPointerDown(e) {
  const el = e.target.closest?.(INTERACTIVE);
  if (!el) return;
  lastPointer = { el, at: performance.now() };
  if (!hasVibrate) return; // iOS: erst im click-Event (s. Kommentar oben)
  haptic(hapticFor(el));
}

function onClick(e) {
  const el = e.target.closest?.(INTERACTIVE);
  if (!el) return;
  // Android: Klick direkt nach pointerdown nicht doppelt; Klicks ohne
  // vorheriges pointerdown (Enter/Space/Programm) trotzdem bespielen.
  if (hasVibrate && lastPointer && lastPointer.el === el && performance.now() - lastPointer.at < 500) return;
  haptic(hapticFor(el));
}

export function initHapticSystem() {
  if (inited) return;
  inited = true;
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('click', onClick, { passive: true });
}
