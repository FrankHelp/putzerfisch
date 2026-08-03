import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../auth.js';
import { rankFor, checkBadges } from '../game.js';
import { savePhoto, deletePhoto } from '../storage.js';

export const router = Router();

export const REACTIONS = ['🫧', '🔥', '👏', '🐠', '🤩', '🧽', '💪', '😱'];

const PAGE = 15;

function shapeLog(row, viewerId) {
  const reactions = db
    .prepare('SELECT emoji, COUNT(*) n FROM reactions WHERE log_id = ? GROUP BY emoji ORDER BY n DESC')
    .all(row.id)
    .map((r) => ({ emoji: r.emoji, count: Number(r.n) }));
  const mine = viewerId
    ? db.prepare('SELECT emoji FROM reactions WHERE log_id = ? AND user_id = ?').all(row.id, viewerId).map((r) => r.emoji)
    : [];
  const commentCount = Number(
    db.prepare('SELECT COUNT(*) n FROM comments WHERE log_id = ?').get(row.id)?.n ?? 0
  );
  return {
    id: row.id,
    activityName: row.activity_name,
    icon: row.icon,
    category: row.category,
    points: row.points,
    basePoints: row.base_points,
    minutes: row.minutes,
    note: row.note,
    photo: row.photo || null,
    bonuses: JSON.parse(row.bonuses || '[]'),
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      displayName: row.display_name,
      username: row.username,
      fish: row.fish,
      color: row.color,
      level: rankFor(row.xp).level,
      rankName: rankFor(row.xp).name,
    },
    wg: row.wg_name ? { id: row.wg_id, name: row.wg_name, emblem: row.wg_emblem } : null,
    reactions,
    myReactions: mine,
    commentCount,
    canDelete: viewerId === row.user_id && Date.now() - new Date(row.created_at).getTime() < 15 * 60 * 1000,
  };
}

/** Feed: scope = global | wg. Cursor = ISO-Zeitstempel des letzten Eintrags. */
router.get('/', optionalAuth, (req, res) => {
  const scope = req.query.scope === 'wg' ? 'wg' : 'global';
  const cursor = String(req.query.cursor ?? '');

  if (scope === 'wg' && !req.user?.wg_id) return res.json({ items: [], nextCursor: null });

  const where = [];
  const params = [];
  if (scope === 'wg') {
    where.push('l.wg_id = ?');
    params.push(req.user.wg_id);
  }
  if (cursor) {
    where.push('l.created_at < ?');
    params.push(cursor);
  }
  const sql = `
    SELECT l.*, u.display_name, u.username, u.fish, u.color, u.xp,
           w.name wg_name, w.emblem wg_emblem
    FROM logs l
    JOIN users u ON u.id = l.user_id
    LEFT JOIN wgs w ON w.id = l.wg_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.created_at DESC
    LIMIT ${PAGE + 1}`;

  const rows = db.prepare(sql).all(...params);
  const hasMore = rows.length > PAGE;
  const items = rows.slice(0, PAGE).map((r) => shapeLog(r, req.user?.id));
  res.json({ items, nextCursor: hasMore ? items[items.length - 1].createdAt : null });
});

/** Einzelner Eintrag (nach dem Loggen für die Erfolgs-Ansicht). */
router.get('/:id', optionalAuth, (req, res) => {
  const row = db
    .prepare(
      `SELECT l.*, u.display_name, u.username, u.fish, u.color, u.xp, w.name wg_name, w.emblem wg_emblem
       FROM logs l JOIN users u ON u.id = l.user_id LEFT JOIN wgs w ON w.id = l.wg_id WHERE l.id = ?`
    )
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
  res.json({ item: shapeLog(row, req.user?.id) });
});

/** Reaktion an/aus schalten. */
router.post('/:id/react', requireAuth, (req, res) => {
  const emoji = String(req.body?.emoji ?? '');
  if (!REACTIONS.includes(emoji)) return res.status(400).json({ error: 'Unbekannte Reaktion.' });
  const log = db.prepare('SELECT id FROM logs WHERE id = ?').get(Number(req.params.id));
  if (!log) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });

  const existing = db
    .prepare('SELECT id FROM reactions WHERE log_id = ? AND user_id = ? AND emoji = ?')
    .get(log.id, req.user.id, emoji);
  if (existing) db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
  else
    db.prepare('INSERT INTO reactions (log_id, user_id, emoji) VALUES (?, ?, ?)').run(log.id, req.user.id, emoji);

  const reactions = db
    .prepare('SELECT emoji, COUNT(*) n FROM reactions WHERE log_id = ? GROUP BY emoji ORDER BY n DESC')
    .all(log.id)
    .map((r) => ({ emoji: r.emoji, count: Number(r.n) }));
  const mine = db
    .prepare('SELECT emoji FROM reactions WHERE log_id = ? AND user_id = ?')
    .all(log.id, req.user.id)
    .map((r) => r.emoji);
  res.json({ reactions, myReactions: mine });
});

// ---- Kommentare --------------------------------------------------------
function shapeComment(c, viewerId) {
  const votes = Number(db.prepare('SELECT COUNT(*) n FROM comment_votes WHERE comment_id = ?').get(c.id)?.n ?? 0);
  const voted = viewerId
    ? !!db.prepare('SELECT 1 v FROM comment_votes WHERE comment_id = ? AND user_id = ?').get(c.id, viewerId)
    : false;
  return {
    id: c.id,
    text: c.text,
    photo: c.photo || null,
    createdAt: c.created_at,
    votes,
    voted,
    canDelete: viewerId === c.user_id,
    user: {
      id: c.user_id,
      displayName: c.display_name,
      fish: c.fish,
      color: c.color,
      level: rankFor(c.xp).level,
    },
  };
}

router.get('/:id/comments', optionalAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, u.display_name, u.fish, u.color, u.xp
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.log_id = ? ORDER BY c.created_at ASC`
    )
    .all(Number(req.params.id));
  const items = rows.map((c) => shapeComment(c, req.user?.id));
  // Beste zuerst, aber innerhalb gleicher Stimmen chronologisch.
  items.sort((a, b) => b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ comments: items });
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const text = String(req.body?.text ?? '').trim().slice(0, 400);
  const log = db.prepare('SELECT id FROM logs WHERE id = ?').get(Number(req.params.id));
  if (!log) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });

  let photo = null;
  try {
    photo = savePhoto(req.body?.photo, req.user.id);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  if (!text && !photo) return res.status(400).json({ error: 'Kommentar ist leer.' });

  const info = db
    .prepare('INSERT INTO comments (log_id, user_id, text, photo, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(log.id, req.user.id, text, photo, new Date().toISOString());
  const row = db
    .prepare(
      `SELECT c.*, u.display_name, u.fish, u.color, u.xp
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(Number(info.lastInsertRowid));
  const newBadges = checkBadges(db, req.user.id, {});
  res.status(201).json({ comment: shapeComment(row, req.user.id), newBadges });
});

export const commentRouter = Router();

commentRouter.post('/:id/vote', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(req.params.id));
  if (!comment) return res.status(404).json({ error: 'Kommentar nicht gefunden.' });
  const existing = db
    .prepare('SELECT 1 v FROM comment_votes WHERE comment_id = ? AND user_id = ?')
    .get(comment.id, req.user.id);
  if (existing)
    db.prepare('DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?').run(comment.id, req.user.id);
  else db.prepare('INSERT INTO comment_votes (comment_id, user_id) VALUES (?, ?)').run(comment.id, req.user.id);

  const votes = Number(
    db.prepare('SELECT COUNT(*) n FROM comment_votes WHERE comment_id = ?').get(comment.id)?.n ?? 0
  );
  res.json({ votes, voted: !existing });
});

commentRouter.delete('/:id', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(req.params.id));
  if (!comment || comment.user_id !== req.user.id)
    return res.status(404).json({ error: 'Kommentar nicht gefunden.' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  deletePhoto(comment.photo);
  res.json({ ok: true });
});

export const metaRouter = Router();
metaRouter.get('/reactions', (_req, res) => res.json({ reactions: REACTIONS }));
