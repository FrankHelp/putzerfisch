import { api, getToken } from './api.js';

/**
 * Push-Benachrichtigungen für die installierte PWA.
 *
 * iOS: Das geht nur in der zum Homescreen hinzugefügten App (iOS 16.4+),
 * und der Permission-Prompt muss aus einer User-Geste kommen – deshalb läuft
 * hier alles über den Button in den Einstellungen, nie automatisch.
 */

let vapidKey = null;

async function getVapidKey() {
  if (vapidKey) return vapidKey;
  const d = await api.get('/push/vapid-key');
  vapidKey = d.publicKey;
  return vapidKey;
}

/** Base64url (VAPID, ohne Padding) -> Uint8Array, wie es die Push-API will. */
function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Läuft die App als installierte PWA (Vollbild, eigenes Icon)? */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Service Worker registrieren – ohne ihn gibt es keinen Push. */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {
    /* ohne SW keine Push-Posts – die App läuft trotzdem ganz normal */
  }
}

/** Aktuelles Abo dieses Geräts, oder null. */
export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/** Zustand für die Einstellungen: 'unsupported' | 'denied' | 'on' | 'off' */
export async function pushState() {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const sub = await currentSubscription();
  return sub ? 'on' : 'off';
}

/**
 * Push aktivieren: Berechtigung + Abo + auf dem Server speichern.
 * MUSS aus einer User-Geste laufen (Button-Klick) – auf iOS schlägt der
 * Prompt sonst still fehl.
 */
export async function enablePush() {
  if (!pushSupported()) throw new Error('Dieses Gerät kann keine Push-Benachrichtigungen.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt.');
  const key = await getVapidKey();
  // SW sicherstellen, sonst hängt ready() ewig: vorhandene nutzen, sonst neu
  // registrieren (wirft mit klarer Meldung, wenn das nicht klappt).
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) await navigator.serviceWorker.register('/sw.js');
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  const { endpoint, keys } = sub.toJSON();
  await api.post('/push/subscribe', { endpoint, keys });
}

/**
 * Push deaktivieren: lokal + auf dem Server entfernen. Beim Ausloggen
 * wichtig, sonst wandern die Pushes zum nächsten Nutzer auf demselben Gerät.
 */
export async function disablePush() {
  const token = getToken(); // sofort greifen – beim Ausloggen erlischt er gleich
  const sub = await currentSubscription();
  if (!sub) return;
  if (token) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    } catch {
      /* offline ist kein Drama – das Abo verfällt von selbst */
    }
  }
  await sub.unsubscribe().catch(() => {});
}
