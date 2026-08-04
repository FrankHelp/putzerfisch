import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAuthQuery } from '../auth.js';
import { unreadCount } from '../notify.js';
import { subscribe } from '../events.js';

export const router = Router();

/**
 * Dauerleitung für neue Riffpost. Der Client hält sie offen und bekommt bei
 * jedem Ereignis den aktuellen Zähler geschickt – kein Pollen mehr nötig.
 */
router.get('/stream', requireAuthQuery, (req, res) => {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  subscribe(req.user.id, res);
  // Startwert, damit der Punkt sofort stimmt und nicht erst beim ersten Ereignis.
  res.write(`event: post\ndata: ${JSON.stringify({ unread: unreadCount(req.user.id) })}\n\n`);
});

const PAGE = 40;

/**
 * Riffpost abholen. Mehrere Ereignisse zum selben Eintrag werden zu einer
 * Karte zusammengefasst ("Nala und 2 andere haben reagiert"), sonst wäre die
 * Muschel nach einem guten Putztag nicht mehr lesbar.
 */
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT n.*, u.display_name, u.fish, u.color, u.xp,
              l.activity_name, l.icon log_icon, l.points log_points,
              c.text comment_text
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       LEFT JOIN logs l ON l.id = n.log_id
       LEFT JOIN comments c ON c.id = n.comment_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`
    )
    .all(req.user.id, PAGE);

  const groups = new Map();
  for (const r of rows) {
    const key = `${r.type}:${r.log_id ?? 'x'}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        type: r.type,
        logId: r.log_id,
        log: r.activity_name
          ? { id: r.log_id, activityName: r.activity_name, icon: r.log_icon, points: r.log_points }
          : null,
        actors: [],
        emojis: [],
        preview: r.comment_text || null,
        unread: false,
        count: 0,
        createdAt: r.created_at,
        ids: [],
      };
      groups.set(key, g);
    }
    g.count += 1;
    g.ids.push(r.id);
    if (!r.read_at) g.unread = true;
    if (!g.actors.some((a) => a.id === r.actor_id)) {
      g.actors.push({
        id: r.actor_id,
        displayName: r.display_name,
        fish: r.fish,
        color: r.color,
      });
    }
    if (r.emoji && !g.emojis.includes(r.emoji)) g.emojis.push(r.emoji);
  }

  // Ungelesenes zuerst, darunter chronologisch.
  const items = [...groups.values()].sort(
    (a, b) => Number(b.unread) - Number(a.unread) || new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({ items, unread: unreadCount(req.user.id) });
});

/** Nur der Zähler – dafür pollt die App im Hintergrund. */
router.get('/count', requireAuth, (req, res) => {
  res.json({ unread: unreadCount(req.user.id) });
});

/** Als gelesen markieren: ohne ids die komplette Muschel. */
router.post('/read', requireAuth, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : null;
  const now = new Date().toISOString();

  if (ids?.length) {
    const marks = ids.map(() => '?').join(',');
    db.prepare(
      `UPDATE notifications SET read_at = ?
       WHERE user_id = ? AND read_at IS NULL AND id IN (${marks})`
    ).run(now, req.user.id, ...ids);
  } else {
    db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL')
      .run(now, req.user.id);
  }

  res.json({ unread: unreadCount(req.user.id) });
});
