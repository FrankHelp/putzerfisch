/**
 * Push-Benachrichtigungen: Riffpost kommt auch ans Handy, wenn die App zu ist.
 *
 * Technik: Web-Push-Protokoll (VAPID). Der Browser abonniert einmalig über den
 * Push-Service des Betriebssystems (iOS/APNs, Android/FCM) und hinterlegt das
 * Abo hier; danach kann der Server jederzeit zustellen – ganz ohne offene
 * App. Scharf ist das erst, wenn VAPID-Schlüssel in der Umgebung stehen
 * (siehe .env.example), sonst läuft die App einfach ohne Push weiter.
 */
import webpush from 'web-push';
import { db } from './db.js';

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:putzerfisch@localhost';

/** Ohne Schlüsselpaar kein Push – der Rest der App bleibt unberührt. */
export const pushEnabled = Boolean(PUBLIC_KEY && PRIVATE_KEY);
export const vapidPublicKey = PUBLIC_KEY;

if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

const listSubs = db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?');
const delSub = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');

/**
 * Zustellung an alle Geräte einer Person. Fire-and-forget: Fehler einzelner
 * Geräte dürfen die Riffpost nie ausbremsen. Tote Abos (Gerät weg, Schlüssel
 * gedreht) melden sich mit 4xx – die werden hier gleich entsorgt.
 */
export async function sendPush(userId, notification) {
  if (!pushEnabled) return;
  const subs = listSubs.all(userId);
  if (!subs.length) return;

  const body = JSON.stringify(notification);
  await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body)
        .catch((err) => {
          if ([401, 403, 404, 410].includes(err?.statusCode)) delSub.run(s.endpoint);
          else console.error('Push fehlgeschlagen:', err.message);
        })
    )
  );
}
