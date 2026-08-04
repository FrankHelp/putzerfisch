import { db } from './db.js';
import { publish } from './events.js';
import { sendPush } from './push.js';

/**
 * Riffpost – wer bekommt mit, was am eigenen Eintrag passiert?
 *
 * Drei Anlässe:
 *   reaction  jemand hat auf meine Putzaktion reagiert
 *   comment   jemand hat meine Putzaktion kommentiert
 *   thread    jemand hat unter einer Aktion kommentiert, unter der ich auch war
 *
 * Grundregel überall: man benachrichtigt sich nie selbst.
 */

const THREAD_MAX_AGE_DAYS = 14;

const insert = db.prepare(
  `INSERT INTO notifications (user_id, actor_id, type, log_id, comment_id, emoji, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

/** Anzeigename für Push-Texte – „Jemand“, falls der Nutzer schon weg ist. */
const nameOf = (userId) =>
  db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId)?.display_name ?? 'Jemand';

/** Baut aus einem Anlass die Push-Benachrichtigung (Titel, Text, Ziel, Gruppe). */
function riffPush(type, logId, text, extra = '') {
  return {
    title: '🐚 Riffpost',
    body: extra ? `${text} ${extra}` : text,
    url: logId ? `/#/log/${logId}` : '/#/feed',
    tag: `${type}:${logId ?? 'x'}`,
  };
}

/**
 * Neuen Stand über die Dauerleitung schicken – die Muschel reagiert sofort.
 * Dazu, wenn ein Push-Text mitkommt (info), die Benachrichtigung ans Handy
 * schicken: die kommt auch an, wenn die App zu ist.
 */
function push(userId, type, info) {
  publish(userId, 'post', { unread: unreadCount(userId), type });
  if (info) sendPush(userId, info); // fire-and-forget, Fehler fängt sendPush ab
}

/** Reaktion auf einen fremden Eintrag. */
export function notifyReaction(logId, actorId, emoji) {
  const log = db.prepare('SELECT user_id FROM logs WHERE id = ?').get(logId);
  if (!log || log.user_id === actorId) return;

  // Ein Eintrag pro (Empfänger, Auslöser, Log): wer seine Reaktion mehrfach
  // umschaltet, soll die Muschel nicht vollmüllen. Emoji und Zeit wandern mit.
  const existing = db
    .prepare(
      `SELECT id FROM notifications
       WHERE user_id = ? AND actor_id = ? AND type = 'reaction' AND log_id = ?`
    )
    .get(log.user_id, actorId, logId);

  if (existing) {
    db.prepare('UPDATE notifications SET emoji = ?, created_at = ?, read_at = NULL WHERE id = ?')
      .run(emoji, new Date().toISOString(), existing.id);
  } else {
    insert.run(log.user_id, actorId, 'reaction', logId, null, emoji, new Date().toISOString());
  }
  push(log.user_id, 'reaction', riffPush('reaction', logId, `${nameOf(actorId)} feiert deine Putzaktion`, emoji));
}

/** Reaktion zurückgenommen – die Benachrichtigung soll nicht stehen bleiben. */
export function unnotifyReaction(logId, actorId) {
  const left = db
    .prepare('SELECT COUNT(*) n FROM reactions WHERE log_id = ? AND user_id = ?')
    .get(logId, actorId);
  if (Number(left?.n ?? 0) > 0) return; // hat noch andere Emojis dagelassen

  const owner = db.prepare('SELECT user_id FROM logs WHERE id = ?').get(logId)?.user_id;
  db.prepare(
    `DELETE FROM notifications
     WHERE actor_id = ? AND type = 'reaction' AND log_id = ?`
  ).run(actorId, logId);
  if (owner) push(owner, 'reaction'); // nur Muschel – zurückgenommene Reaktion klingelt nicht am Handy
}

/**
 * Neuer Kommentar: die schreibende Person löst zwei Wellen aus – eine an die
 * Urheberin des Eintrags, eine kleinere an die anderen Kommentierenden.
 */
export function notifyComment(logId, commentId, actorId) {
  const log = db.prepare('SELECT user_id, created_at FROM logs WHERE id = ?').get(logId);
  if (!log) return;
  const now = new Date().toISOString();
  const preview = db.prepare('SELECT text FROM comments WHERE id = ?').get(commentId)?.text ?? '';

  if (log.user_id !== actorId) {
    insert.run(log.user_id, actorId, 'comment', logId, commentId, null, now);
    push(
      log.user_id,
      'comment',
      riffPush(
        'comment',
        logId,
        `${nameOf(actorId)} hat deine Putzaktion kommentiert`,
        preview ? `„${preview}“` : ''
      )
    );
  }

  // ---- Mitschwimmer ----------------------------------------------------
  // Absichtlich nur "manchmal": alte Threads schweigen, und wer noch eine
  // ungelesene Thread-Post zu diesem Eintrag hat, bekommt keine zweite.
  const age = Date.now() - new Date(log.created_at).getTime();
  if (age > THREAD_MAX_AGE_DAYS * 86400000) return;

  const participants = db
    .prepare(
      `SELECT DISTINCT user_id FROM comments
       WHERE log_id = ? AND user_id != ? AND user_id != ?`
    )
    .all(logId, actorId, log.user_id)
    .map((r) => r.user_id);

  const pending = db.prepare(
    `SELECT 1 v FROM notifications
     WHERE user_id = ? AND type = 'thread' AND log_id = ? AND read_at IS NULL`
  );

  for (const uid of participants) {
    if (pending.get(uid, logId)) continue;
    insert.run(uid, actorId, 'thread', logId, commentId, null, now);
    push(uid, 'thread', riffPush('thread', logId, `${nameOf(actorId)} schwimmt im selben Thread mit`));
  }
}

/** Ungelesene Post – der Zähler an der Muschel. */
export function unreadCount(userId) {
  return Number(
    db.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL')
      .get(userId)?.n ?? 0
  );
}
