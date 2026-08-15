import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../auth.js';
import { rankFor, BADGES, dayKey, berlinDayRange, activeStreak } from '../game.js';
import { CATEGORIES } from '../catalog.js';

export const router = Router();

/** Öffentliches Profil inkl. Statistik, Badges und Aktivitätsverlauf. */
router.get('/:id', optionalAuth, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'Diesen Fisch gibt es nicht.' });

  const totals = db
    .prepare('SELECT COUNT(*) n, COALESCE(SUM(points),0) p, COALESCE(SUM(minutes),0) m FROM logs WHERE user_id = ?')
    .get(u.id);

  const perCategory = db
    .prepare('SELECT category, COUNT(*) n, COALESCE(SUM(points),0) p FROM logs WHERE user_id = ? GROUP BY category')
    .all(u.id);
  const byCategory = CATEGORIES.map((c) => {
    const hit = perCategory.find((r) => r.category === c.id);
    return { ...c, count: Number(hit?.n ?? 0), points: Number(hit?.p ?? 0) };
  }).sort((a, b) => b.points - a.points);

  const favourite = db
    .prepare('SELECT activity_name, icon, COUNT(*) n FROM logs WHERE user_id = ? GROUP BY activity_name ORDER BY n DESC LIMIT 1')
    .get(u.id);

  // Letzte 14 Tage als Mini-Verlauf
  const history = [];
  for (let i = 13; i >= 0; i--) {
    const day = dayKey(new Date(Date.now() - i * 86400000));
    const [from, to] = berlinDayRange(day);
    const row = db
      .prepare('SELECT COALESCE(SUM(points),0) p FROM logs WHERE user_id = ? AND created_at >= ? AND created_at < ?')
      .get(u.id, from, to);
    history.push({ day, points: Number(row.p) });
  }

  const badges = db
    .prepare('SELECT code, created_at FROM badges WHERE user_id = ? ORDER BY created_at DESC')
    .all(u.id)
    .map((b) => ({ code: b.code, earnedAt: b.created_at, ...BADGES[b.code] }))
    .filter((b) => b.name);

  const globalRank = Number(
    db.prepare('SELECT COUNT(*) n FROM users WHERE xp > ?').get(u.xp).n
  ) + 1;

  const wg = u.wg_id ? db.prepare('SELECT id, name, emblem FROM wgs WHERE id = ?').get(u.wg_id) : null;

  const recent = db
    .prepare('SELECT id, activity_name, icon, points, created_at FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10')
    .all(u.id)
    .map((l) => ({ id: l.id, name: l.activity_name, icon: l.icon, points: l.points, createdAt: l.created_at }));

  res.json({
    user: {
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      fish: u.fish,
      color: u.color,
      xp: u.xp,
      streak: activeStreak(u),
      bestStreak: u.best_streak,
      rank: rankFor(u.xp),
      createdAt: u.created_at,
      wg,
      isMe: req.user?.id === u.id,
    },
    stats: {
      actions: Number(totals.n),
      points: Number(totals.p),
      minutes: Number(totals.m),
      globalRank,
      favourite: favourite ? { name: favourite.activity_name, icon: favourite.icon, count: Number(favourite.n) } : null,
    },
    byCategory,
    history,
    badges,
    allBadges: BADGES,
    recent,
  });
});
