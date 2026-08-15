import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { reefHealth, rankFor, activeStreak } from '../game.js';
import { publicUser } from './auth.js';

export const router = Router();

const EMBLEMS = ['🪸', '🐚', '🌊', '⚓', '🏝️', '🦑', '🐳', '🧜', '🗿', '🫧', '🦞', '🐢'];

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne I/O/0/1
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from(crypto.randomBytes(6))
      .map((b) => alphabet[b % alphabet.length])
      .join('');
    if (!db.prepare('SELECT 1 x FROM wgs WHERE invite_code = ?').get(code)) return code;
  }
  throw new Error('Konnte keinen freien Einladungscode erzeugen.');
}

router.get('/emblems', (_req, res) => res.json({ emblems: EMBLEMS }));

/** Details der eigenen (oder einer bestimmten) WG. */
router.get('/mine', requireAuth, (req, res) => {
  if (!req.user.wg_id) return res.json({ wg: null });
  const wg = db.prepare('SELECT * FROM wgs WHERE id = ?').get(req.user.wg_id);
  const members = db
    .prepare('SELECT * FROM users WHERE wg_id = ? ORDER BY xp DESC')
    .all(wg.id)
    .map((m) => ({
      id: m.id,
      displayName: m.display_name,
      fish: m.fish,
      color: m.color,
      xp: m.xp,
      streak: activeStreak(m),
      level: rankFor(m.xp).level,
      rankName: rankFor(m.xp).name,
      isMe: m.id === req.user.id,
    }));
  res.json({
    wg: {
      id: wg.id,
      name: wg.name,
      emblem: wg.emblem,
      motto: wg.motto,
      inviteCode: wg.invite_code,
      createdAt: wg.created_at,
    },
    members,
    reef: reefHealth(db, wg.id),
  });
});

router.post('/create', requireAuth, (req, res) => {
  if (req.user.wg_id) return res.status(400).json({ error: 'Du bist schon in einer WG. Erst verlassen.' });
  const name = String(req.body?.name ?? '').trim();
  const motto = String(req.body?.motto ?? '').trim().slice(0, 80);
  const emblem = EMBLEMS.includes(req.body?.emblem) ? req.body.emblem : '🪸';
  if (name.length < 2 || name.length > 30)
    return res.status(400).json({ error: 'WG-Name muss 2–30 Zeichen haben.' });

  const code = makeCode();
  const info = db
    .prepare('INSERT INTO wgs (name, invite_code, emblem, motto, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name, code, emblem, motto, new Date().toISOString());
  const wgId = Number(info.lastInsertRowid);
  db.prepare('UPDATE users SET wg_id = ? WHERE id = ?').run(wgId, req.user.id);
  // Bereits geloggte Aktionen dieser Person der neuen WG zuordnen wäre unfair –
  // die WG startet bewusst bei null.
  res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

router.post('/join', requireAuth, (req, res) => {
  if (req.user.wg_id) return res.status(400).json({ error: 'Du bist schon in einer WG. Erst verlassen.' });
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  const wg = db.prepare('SELECT * FROM wgs WHERE invite_code = ?').get(code);
  if (!wg) return res.status(404).json({ error: 'Diesen Einladungscode gibt es nicht.' });

  db.prepare('UPDATE users SET wg_id = ? WHERE id = ?').run(wg.id, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

router.post('/leave', requireAuth, (req, res) => {
  if (!req.user.wg_id) return res.status(400).json({ error: 'Du bist in keiner WG.' });
  const wgId = req.user.wg_id;
  db.prepare('UPDATE users SET wg_id = NULL WHERE id = ?').run(req.user.id);

  // Leere WGs aufräumen; die Log-Historie bleibt (wg_id wird auf NULL gesetzt).
  const left = Number(db.prepare('SELECT COUNT(*) n FROM users WHERE wg_id = ?').get(wgId).n);
  if (left === 0) db.prepare('DELETE FROM wgs WHERE id = ?').run(wgId);

  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

router.patch('/mine', requireAuth, (req, res) => {
  if (!req.user.wg_id) return res.status(400).json({ error: 'Du bist in keiner WG.' });
  const wg = db.prepare('SELECT * FROM wgs WHERE id = ?').get(req.user.wg_id);
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : wg.name;
  const motto = req.body?.motto !== undefined ? String(req.body.motto).trim().slice(0, 80) : wg.motto;
  const emblem = EMBLEMS.includes(req.body?.emblem) ? req.body.emblem : wg.emblem;
  if (name.length < 2 || name.length > 30)
    return res.status(400).json({ error: 'WG-Name muss 2–30 Zeichen haben.' });

  db.prepare('UPDATE wgs SET name = ?, motto = ?, emblem = ? WHERE id = ?').run(name, motto, emblem, wg.id);
  res.json({ ok: true });
});
