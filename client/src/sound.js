/* ---------- Sound-Manager: Hintergrundmusik + UI-Sounds ----------
 * Modul-Singleton: Die Audio-Elemente leben außerhalb von React, damit
 * StrictMode-Doppel-Mounts nichts doppelt starten und keine Komponente
 * den Sound "besitzt". Die App ruft nur Funktionen auf.
 *
 * Musik: Autoplay-Versuch direkt beim Start; Browser blocken das aber,
 * solange der Nutzer noch nicht interagiert hat. Deshalb gibt es einen
 * Einmal-Hörer, der die Musik beim ersten Klick/Tipp/Tastendruck startet.
 */

const SOUND_KEY = 'putz:sound'; // '1' = an, '0' = aus – Master-Schalter für Musik + UI-Sounds
const MUSIC_KEY = 'putz:music'; // alter Ein/Aus-Key (nur noch für Migration)
const VOL_KEY = 'putz:musicVol'; // 0..1 – interne Musik-Lautstärke (kein Regler mehr in der UI)

const FILES = {
  background: '/sounds/background_loop.mp3',
  pop: '/sounds/pop.mp3',
  heavy: '/sounds/heavier_pop.mp3',
  heaviest: '/sounds/heaviest_pop.mp3',
  double: '/sounds/double_pop.mp3',
  swooosh: '/sounds/swoooosh.mp3',
  notification: '/sounds/notification.mp3',
};

const DEFAULT_MUSIC_VOLUME = 0.25;
const UI_VOLUME = 0.8;
const POP_GAP = 90; // ms – verhindert Maschinengewehr-Geklicke bei Pops
const SWOOSH_GAP = 140; // ms – Slider feuern beim Ziehen schnell hintereinander

let inited = false;
let music = null;
let armed = false; // Erst-Interaktions-Hörer aktiv?
let soundEnabled = readSoundEnabled(); // Master-Schalter (Musik + UI-Sounds)
let musicVolume = readVolume();
const ui = {}; // Name -> Audio-Element
const last = new Map(); // Name -> letzter Play-Zeitpunkt (performance.now)

function readSoundEnabled() {
  const raw = localStorage.getItem(SOUND_KEY);
  if (raw === '1') return true;
  if (raw === '0') return false;
  // Migration: alter Ein/Aus-Toggle (putz:music) entscheidet
  return localStorage.getItem(MUSIC_KEY) !== '0';
}

function readVolume() {
  const v = parseFloat(localStorage.getItem(VOL_KEY));
  if (!Number.isNaN(v)) return Math.min(1, Math.max(0, v));
  // Erste Version hatte nur Ein/Aus: "0" -> stumm, sonst Standardlautstärke
  return localStorage.getItem(MUSIC_KEY) === '0' ? 0 : DEFAULT_MUSIC_VOLUME;
}

function makeAudio(src, volume, loop = false) {
  const a = new Audio(src);
  a.volume = volume;
  a.loop = loop;
  a.preload = 'auto';
  return a;
}

function ensureAudio() {
  if (!music) music = makeAudio(FILES.background, musicVolume, true);
  for (const [name, src] of Object.entries(FILES)) {
    if (name === 'background' || ui[name]) continue;
    ui[name] = makeAudio(src, UI_VOLUME);
  }
}

/* ---------- Master-Schalter (Musik + UI-Sounds) ---------- */

export function getSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(on) {
  soundEnabled = !!on;
  localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0');
  localStorage.setItem(MUSIC_KEY, soundEnabled ? '1' : '0');
  ensureAudio();
  if (soundEnabled) {
    // War der Sound vorher aus (evtl. mit Lautstärke 0 gespeichert), wieder hörbar starten
    if (musicVolume <= 0) {
      musicVolume = DEFAULT_MUSIC_VOLUME;
      music.volume = musicVolume;
    }
    startMusic();
  } else {
    armed = false;
    music.pause();
  }
}

/* ---------- Hintergrundmusik ---------- */

export function startMusic() {
  ensureAudio();
  if (!soundEnabled || musicVolume <= 0 || !music.paused) return;
  const p = music.play();
  if (p) p.catch(() => armFirstInteraction());
  else armFirstInteraction();
}

/* Musik starten, sobald der Nutzer das erste Mal interagiert
 * (Browser erlauben Audio erst nach einer User-Geste). */
function armFirstInteraction() {
  if (armed || !soundEnabled || musicVolume <= 0) return;
  armed = true;
  const unlock = () => {
    music.play().catch(() => {});
    cleanup();
  };
  const cleanup = () => {
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.removeEventListener(t, unlock));
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) =>
    window.addEventListener(t, unlock, { once: true, passive: true })
  );
}

/* ---------- UI-Sounds ---------- */

export function playUi(name) {
  if (!soundEnabled || !FILES[name] || name === 'background') return;
  ensureAudio();
  const now = performance.now();
  const gap = name === 'swooosh' ? SWOOSH_GAP : POP_GAP;
  if (now - (last.get(name) ?? 0) < gap) return;
  last.set(name, now);
  const a = ui[name];
  a.currentTime = 0; // Neustart von vorn, falls er noch läuft
  a.play().catch(() => {});
}

/* ---------- Globale Verdrahtung ---------- */

const INTERACTIVE =
  'button, a, [role="button"], .sheet-backdrop, .code-box, input[type="range"], .link, .link-btn';

/* Welcher Sound passt zu welchem Element?
 * Reihenfolge ist wichtig: .btn-primary/.btn haben mehrere Klassen. */
function soundFor(el) {
  if (!el) return null;
  if (el.matches('.fab')) return 'heaviest';
  if (el.matches('.btn-primary')) return 'double';
  if (el.matches('.btn')) return 'heavy';
  if (el.matches('.sheet-backdrop')) return 'swooosh';
  if (el.matches('input[type="range"]')) return 'swooosh';
  return 'pop';
}

let lastPointer = null; // { el, at } – für Klick-Dedupe (Tastatur/Programm-Klicks)

function onPointerDown(e) {
  const el = e.target.closest?.(INTERACTIVE);
  if (!el) return;
  lastPointer = { el, at: performance.now() };
  playUi(soundFor(el));
}

function onClick(e) {
  // Klicks ohne vorheriges pointerdown (Enter/Space/Programm) trotzdem bespielen
  const el = e.target.closest?.(INTERACTIVE);
  if (!el) return;
  if (lastPointer && lastPointer.el === el && performance.now() - lastPointer.at < 500) return;
  playUi(soundFor(el));
}

function onInput(e) {
  if (e.target.matches?.('input[type="range"]')) playUi('swooosh');
}

export function initSoundSystem() {
  if (inited) return;
  inited = true;
  ensureAudio();
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('click', onClick, { passive: true });
  window.addEventListener('input', onInput, { passive: true });
}
