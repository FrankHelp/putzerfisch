import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { CATEGORIES } from '../catalog.js';
import { computePoints, updateStreak, checkBadges, rankFor, dayKey } from '../game.js';
import { publicUser } from './auth.js';

export const router = Router();

router.get('/categories', (_req, res) => res.json({ categories: CATEGORIES }));

/** Katalog: optional gefiltert nach Kategorie oder Suchbegriff. */
router.get('/', (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const category = String(req.query.category ?? '').trim();

  let rows = db.prepare('SELECT * FROM activities ORDER BY category, points DESC').all();
  if (category) rows = rows.filter((r) => r.category === category);
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    rows = rows
      .map((r) => {
        const hay = `${r.name} ${r.keywords} ${r.category}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (r.name.toLowerCase().startsWith(t)) score += 5;
          else if (r.name.toLowerCase().includes(t)) score += 3;
          else if (hay.includes(t)) score += 1;
        }
        return { r, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.r.points - a.r.points)
      .map((x) => x.r);
  }
  res.json({ activities: rows.map(shapeActivity) });
});

const shapeActivity = (a) => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  category: a.category,
  icon: a.icon,
  points: a.points,
  minutes: a.minutes,
  communityMade: !!a.created_by,
});

/** Vorschau: was würde diese Aktivität mir gerade bringen? */
router.get('/:id/preview', requireAuth, (req, res) => {
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(Number(req.params.id));
  if (!activity) return res.status(404).json({ error: 'Aktivität nicht gefunden.' });

  const today = dayKey();
  const projectedStreak = req.user.last_clean_day === today
    ? req.user.streak
    : req.user.last_clean_day === dayKey(new Date(Date.now() - 86400000))
      ? req.user.streak + 1
      : 1;

  const { points, bonuses } = computePoints(db, req.user, activity, projectedStreak);
  res.json({ basePoints: activity.points, points, bonuses });
});

/** Putzaktion eintragen. */
router.post('/log', requireAuth, (req, res) => {
  const activityId = Number(req.body?.activityId);
  const note = String(req.body?.note ?? '').trim().slice(0, 240);
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
  if (!activity) return res.status(400).json({ error: 'Diese Aktivität kenne ich nicht.' });

  const before = rankFor(req.user.xp);
  const { streak } = updateStreak(db, req.user);
  const { points, bonuses } = computePoints(db, req.user, activity, streak);

  const info = db
    .prepare(
      `INSERT INTO logs (user_id, wg_id, activity_id, activity_name, icon, category,
                         base_points, points, minutes, note, bonuses, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id, req.user.wg_id, activity.id, activity.name, activity.icon, activity.category,
      activity.points, points, activity.minutes, note, JSON.stringify(bonuses), new Date().toISOString()
    );

  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(points, req.user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const after = rankFor(updated.xp);
  const newBadges = checkBadges(db, req.user.id, { hour: new Date().getHours(), points });

  res.status(201).json({
    logId: Number(info.lastInsertRowid),
    points,
    basePoints: activity.points,
    bonuses,
    streak,
    leveledUp: after.level > before.level ? after : null,
    newBadges,
    user: publicUser(updated),
  });
});

/** Eintrag zurücknehmen (nur eigener, nur innerhalb von 15 Minuten). */
router.delete('/log/:id', requireAuth, (req, res) => {
  const log = db.prepare('SELECT * FROM logs WHERE id = ?').get(Number(req.params.id));
  if (!log || log.user_id !== req.user.id) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
  if (Date.now() - new Date(log.created_at).getTime() > 15 * 60 * 1000)
    return res.status(403).json({ error: 'Nach 15 Minuten kann ein Eintrag nicht mehr gelöscht werden.' });

  db.prepare('DELETE FROM logs WHERE id = ?').run(log.id);
  db.prepare('UPDATE users SET xp = MAX(0, xp - ?) WHERE id = ?').run(log.points, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});
