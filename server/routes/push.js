import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { vapidPublicKey } from '../push.js';

export const router = Router();

/**
 * Push-Abos verwalten. Der Client abonniert beim Browser-Push-Service und
 * hinterlegt das Abo hier – beim Ausloggen oder Deaktivieren fliegt es wieder
 * raus (sonst wandern die Pushes zum nächsten Nutzer auf demselben Gerät).
 */

/** Öffentlicher VAPID-Schlüssel – der Browser braucht ihn zum Abonnieren. */
router.get('/vapid-key', (_req, res) => {
  if (!vapidPublicKey) {
    return res
      .status(503)
      .json({ error: 'Push ist nicht eingerichtet (VAPID-Schlüssel fehlen auf dem Server).' });
  }
  res.json({ publicKey: vapidPublicKey });
});

/** Abo speichern: ein Gerät, ein Eintrag – der endpoint IST das Gerät. */
router.post('/subscribe', requireAuth, (req, res) => {
  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Unvollständiges Push-Abo.' });
  }
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id, p256dh = excluded.p256dh,
       auth = excluded.auth, created_at = excluded.created_at`
  ).run(req.user.id, endpoint, keys.p256dh, keys.auth, new Date().toISOString());
  res.json({ ok: true });
});

/** Abo entfernen – beim Ausloggen oder wenn die App es nicht mehr will. */
router.delete('/subscribe', requireAuth, (req, res) => {
  const endpoint = req.body?.endpoint;
  if (endpoint) db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  res.json({ ok: true });
});
