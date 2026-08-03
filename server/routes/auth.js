import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';
import { rankFor, BADGES } from '../game.js';

export const router = Router();

export const FISH_OPTIONS = ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦀', '🐢', '🐬', '🐳', '🪼', '🦭', '🐚'];
export const COLOR_OPTIONS = ['#2ee6d6', '#5ad1ff', '#a78bfa', '#f472b6', '#ffb45c', '#4ade80', '#fcd34d', '#fb7185'];

export function publicUser(u) {
  if (!u) return null;
  const rank = rankFor(u.xp);
  const badges = db
    .prepare('SELECT code, created_at FROM badges WHERE user_id = ? ORDER BY created_at')
    .all(u.id)
    .map((b) => ({ code: b.code, earnedAt: b.created_at, ...BADGES[b.code] }))
    .filter((b) => b.name);
  const wg = u.wg_id ? db.prepare('SELECT id, name, emblem, invite_code, motto FROM wgs WHERE id = ?').get(u.wg_id) : null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    fish: u.fish,
    color: u.color,
    xp: u.xp,
    streak: u.streak,
    bestStreak: u.best_streak,
    rank,
    badges,
    wg: wg ? { id: wg.id, name: wg.name, emblem: wg.emblem, inviteCode: wg.invite_code, motto: wg.motto } : null,
    createdAt: u.created_at,
  };
}

router.post('/register', (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const displayName = String(req.body?.displayName ?? '').trim() || username;
  const password = String(req.body?.password ?? '');
  const fish = FISH_OPTIONS.includes(req.body?.fish) ? req.body.fish : '🐠';
  const color = COLOR_OPTIONS.includes(req.body?.color) ? req.body.color : '#2ee6d6';

  if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(username))
    return res.status(400).json({ error: 'Nutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, . _ -' });
  if (password.length < 6) return res.status(400).json({ error: 'Passwort braucht mindestens 6 Zeichen.' });
  if (displayName.length > 24) return res.status(400).json({ error: 'Anzeigename ist zu lang (max. 24).' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Diesen Nutzernamen gibt es schon.' });

  const info = db
    .prepare(
      `INSERT INTO users (username, display_name, password_hash, fish, color, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(username, displayName, hashPassword(password), fish, color, new Date().toISOString());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password_hash))
    return res.status(401).json({ error: 'Nutzername oder Passwort stimmt nicht.' });
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const u = req.user;
  const displayName = req.body?.displayName !== undefined ? String(req.body.displayName).trim() : u.display_name;
  const fish = FISH_OPTIONS.includes(req.body?.fish) ? req.body.fish : u.fish;
  const color = COLOR_OPTIONS.includes(req.body?.color) ? req.body.color : u.color;
  if (!displayName || displayName.length > 24)
    return res.status(400).json({ error: 'Anzeigename muss 1–24 Zeichen haben.' });

  db.prepare('UPDATE users SET display_name = ?, fish = ?, color = ? WHERE id = ?')
    .run(displayName, fish, color, u.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)) });
});

router.get('/options', (_req, res) => {
  res.json({ fish: FISH_OPTIONS, colors: COLOR_OPTIONS, badges: BADGES });
});
