import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../auth.js';
import { rankFor, reefHealth } from '../game.js';

export const router = Router();

/** Zeitfenster → SQL-Bedingung auf logs.created_at */
function sinceFor(range) {
  if (range === 'week') return new Date(Date.now() - 7 * 86400000).toISOString();
  if (range === 'month') return new Date(Date.now() - 30 * 86400000).toISOString();
  return null; // 'all'
}

const shapeEntry = (r, i, viewerId) => ({
  rank: i + 1,
  id: r.id,
  displayName: r.display_name,
  username: r.username,
  fish: r.fish,
  color: r.color,
  points: Number(r.points ?? 0),
  streak: r.streak,
  level: rankFor(r.xp).level,
  rankName: rankFor(r.xp).name,
  wg: r.wg_name ? { name: r.wg_name, emblem: r.wg_emblem } : null,
  isMe: r.id === viewerId,
});

/** Globales Einzel-Leaderboard über alle Nutzer. */
router.get('/global', optionalAuth, (req, res) => {
  const range = String(req.query.range ?? 'all');
  const since = sinceFor(range);
  const rows = since
    ? db
        .prepare(
          `SELECT u.*, COALESCE(SUM(l.points), 0) points, w.name wg_name, w.emblem wg_emblem
           FROM users u
           LEFT JOIN logs l ON l.user_id = u.id AND l.created_at >= ?
           LEFT JOIN wgs w ON w.id = u.wg_id
           GROUP BY u.id ORDER BY points DESC, u.xp DESC LIMIT 100`
        )
        .all(since)
    : db
        .prepare(
          `SELECT u.*, u.xp points, w.name wg_name, w.emblem wg_emblem
           FROM users u LEFT JOIN wgs w ON w.id = u.wg_id
           ORDER BY points DESC LIMIT 100`
        )
        .all();

  const entries = rows.map((r, i) => shapeEntry(r, i, req.user?.id));
  const me = entries.find((e) => e.isMe) ?? null;
  res.json({ entries, me, total: Number(db.prepare('SELECT COUNT(*) n FROM users').get().n) });
});

/** Interne Rangliste der eigenen WG. */
router.get('/wg', optionalAuth, (req, res) => {
  const wgId = Number(req.query.wgId) || req.user?.wg_id;
  if (!wgId) return res.status(400).json({ error: 'Du bist in keiner WG.' });
  const range = String(req.query.range ?? 'all');
  const since = sinceFor(range);

  const rows = since
    ? db
        .prepare(
          `SELECT u.*, COALESCE(SUM(l.points), 0) points
           FROM users u LEFT JOIN logs l ON l.user_id = u.id AND l.created_at >= ?
           WHERE u.wg_id = ? GROUP BY u.id ORDER BY points DESC, u.xp DESC`
        )
        .all(since, wgId)
    : db.prepare('SELECT u.*, u.xp points FROM users u WHERE u.wg_id = ? ORDER BY points DESC').all(wgId);

  const wg = db.prepare('SELECT * FROM wgs WHERE id = ?').get(wgId);
  const entries = rows.map((r, i) => shapeEntry(r, i, req.user?.id));
  const total = entries.reduce((s, e) => s + e.points, 0);
  const fairShare = entries.length ? Math.round(total / entries.length) : 0;

  res.json({
    wg: wg ? { id: wg.id, name: wg.name, emblem: wg.emblem, motto: wg.motto } : null,
    entries: entries.map((e) => ({ ...e, share: total ? Math.round((e.points / total) * 100) : 0, fairShare })),
    total,
    fairShare,
    reef: reefHealth(db, wgId),
  });
});

/**
 * WG-Liga: alle WGs im Vergleich, gewertet über die *gemittelten* Punkte
 * pro Mitglied – so haben kleine WGs die gleiche Chance wie große.
 */
router.get('/wgs', optionalAuth, (req, res) => {
  const range = String(req.query.range ?? 'all');
  const since = sinceFor(range);

  const wgs = db.prepare('SELECT * FROM wgs').all();
  const rows = wgs
    .map((wg) => {
      const members = db.prepare('SELECT id, xp FROM users WHERE wg_id = ?').all(wg.id);
      if (!members.length) return null;
      const points = since
        ? Number(
            db.prepare('SELECT COALESCE(SUM(points),0) s FROM logs WHERE wg_id = ? AND created_at >= ?')
              .get(wg.id, since)?.s ?? 0
          )
        : members.reduce((s, m) => s + m.xp, 0);
      const avg = Math.round(points / members.length);
      return {
        id: wg.id,
        name: wg.name,
        emblem: wg.emblem,
        motto: wg.motto,
        members: members.length,
        total: points,
        average: avg,
        reef: reefHealth(db, wg.id),
        isMine: req.user?.wg_id === wg.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.average - a.average)
    .map((w, i) => ({ ...w, rank: i + 1 }));

  res.json({ entries: rows, me: rows.find((w) => w.isMine) ?? null });
});

/** Kleine Statistik-Kachel für die Startseite. */
router.get('/pulse', optionalAuth, (_req, res) => {
  const since24 = new Date(Date.now() - 86400000).toISOString();
  const row = db
    .prepare('SELECT COUNT(*) n, COALESCE(SUM(points),0) p, COALESCE(SUM(minutes),0) m FROM logs WHERE created_at >= ?')
    .get(since24);
  res.json({
    actions24h: Number(row.n),
    points24h: Number(row.p),
    minutes24h: Number(row.m),
    cleaners: Number(db.prepare('SELECT COUNT(*) n FROM users').get().n),
  });
});
