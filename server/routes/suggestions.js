import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../auth.js';
import { CATEGORY_IDS } from '../catalog.js';
import { awardBadge, rankFor } from '../game.js';
import { moderateSuggestion, rateLimitCheck, recordAttempt, MAX_FAILS, COOLDOWN_MS } from '../seacow.js';

export const router = Router();

/** So viele Stimmen braucht ein Vorschlag, um in den Katalog zu wandern. */
export const APPROVE_THRESHOLD = Number(process.env.PUTZAPP_APPROVE_VOTES || 10);

function shape(s, viewerId) {
  const votes = Number(
    db.prepare('SELECT COUNT(*) n FROM suggestion_votes WHERE suggestion_id = ?').get(s.id)?.n ?? 0
  );
  const voted = viewerId
    ? !!db.prepare('SELECT 1 v FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?').get(s.id, viewerId)
    : false;
  const author = s.user_id ? db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id) : null;
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    icon: s.icon,
    points: s.points,
    minutes: s.minutes,
    description: s.description,
    status: s.status,
    createdAt: s.created_at,
    votes,
    voted,
    needed: Math.max(0, APPROVE_THRESHOLD - votes),
    threshold: APPROVE_THRESHOLD,
    isMine: viewerId === s.user_id,
    author: author
      ? {
          id: author.id,
          displayName: author.display_name,
          fish: author.fish,
          color: author.color,
          level: rankFor(author.xp).level,
        }
      : null,
  };
}

router.get('/', optionalAuth, (req, res) => {
  const status = ['open', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'open';
  const sort = req.query.sort === 'new' ? 'new' : 'top';
  const rows = db.prepare('SELECT * FROM suggestions WHERE status = ?').all(status);
  const items = rows.map((s) => shape(s, req.user?.id));
  items.sort(
    sort === 'new'
      ? (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      : (a, b) => b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ suggestions: items, threshold: APPROVE_THRESHOLD });
});

router.post('/', requireAuth, async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const category = CATEGORY_IDS.includes(req.body?.category) ? req.body.category : null;
  const icon = String(req.body?.icon ?? '🧽').slice(0, 8) || '🧽';
  const points = Math.max(5, Math.min(100, Math.round(Number(req.body?.points) || 15)));
  const minutes = Math.max(1, Math.min(240, Math.round(Number(req.body?.minutes) || 10)));
  const description = String(req.body?.description ?? '').trim().slice(0, 300);

  if (name.length < 3 || name.length > 60)
    return res.status(400).json({ error: 'Name muss 3–60 Zeichen haben.' });
  if (!category) return res.status(400).json({ error: 'Bitte eine gültige Kategorie wählen.' });

  // Rate-Limit: nach 3 Fehlversuchen lässt die Seekuh nur 1 Versuch pro 30 s durch.
  const limit = rateLimitCheck(req.user.id);
  if (!limit.allowed)
    return res.status(429).json({
      error: `Die dumme Seekuh ist noch am Verdauen. Versuch's in ${limit.retryAfter} s nochmal.`,
      retryAfter: limit.retryAfter,
    });

  const dupe = db.prepare('SELECT 1 x FROM activities WHERE lower(name) = lower(?)').get(name);
  if (dupe) return res.status(409).json({ error: 'Diese Aktivität gibt es schon im Katalog.' });
  const dupeOpen = db
    .prepare("SELECT 1 x FROM suggestions WHERE lower(name) = lower(?) AND status = 'open'")
    .get(name);
  if (dupeOpen) return res.status(409).json({ error: 'Das hat schon jemand vorgeschlagen – stimm dort mit ab!' });

  // Versuch JETZT buchen (fail-closed), bevor die Seekuh antwortet. Würde der
  // Eintrag erst nach der Moderation geschrieben, könnten parallele Requests
  // (Doppelklick, zweiter Tab) das Rate-Limit umgehen: Sie alle sehen noch den
  // alten fail_streak, während die ersten Versuche noch bei der API hängen.
  // Ein API-Fehler (503) bleibt als Fehlversuch stehen – so kann die
  // DeepSeek-API bei Ausfällen nicht unbegrenzt nachgeballert werden.
  const fails = recordAttempt(req.user.id, false);

  let ok;
  try {
    ok = await moderateSuggestion({ name, description });
  } catch (err) {
    console.error('Seekuh-Moderation fehlgeschlagen:', err.message);
    return res.status(503).json({ error: 'Die dumme Seekuh ist gerade auf Tauchgang. Versuch’s gleich nochmal!' });
  }

  if (!ok) {
    return res.status(422).json({
      error: 'Das schwimmt hier nicht. Versuch’s nochmal!',
      rejected: true,
      // Ab 3/3 beginnt sofort die Pause – der Client sperrt den Button damit.
      // fails/maxFails bewusst NICHT mitsenden: Der Zähl-Mechanismus bleibt
      // für Clients außen vor.
      retryAfter: fails >= MAX_FAILS ? Math.ceil(COOLDOWN_MS / 1000) : undefined,
    });
  }

  // Annahme: Den soeben als Fehlversuch gebuchten Eintrag zur Annahme umbuchen,
  // damit die Serie wieder bei 0 steht und das Limit nicht weiter zählt.
  db.prepare(
    `UPDATE seacow_attempts
     SET accepted = 1, fail_streak = 0
     WHERE id = (SELECT id FROM seacow_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1)`
  ).run(req.user.id);

  const info = db
    .prepare(
      `INSERT INTO suggestions (user_id, name, category, icon, points, minutes, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, name, category, icon, points, minutes, description, new Date().toISOString());

  // Die eigene Stimme zählt automatisch.
  db.prepare('INSERT OR IGNORE INTO suggestion_votes (suggestion_id, user_id) VALUES (?, ?)')
    .run(Number(info.lastInsertRowid), req.user.id);

  const row = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ suggestion: shape(row, req.user.id) });
});

router.post('/:id/vote', requireAuth, (req, res) => {
  const s = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(Number(req.params.id));
  if (!s) return res.status(404).json({ error: 'Vorschlag nicht gefunden.' });
  if (s.status !== 'open') return res.status(400).json({ error: 'Über diesen Vorschlag ist schon entschieden.' });

  const existing = db
    .prepare('SELECT 1 v FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?')
    .get(s.id, req.user.id);
  if (existing)
    db.prepare('DELETE FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?').run(s.id, req.user.id);
  else
    db.prepare('INSERT INTO suggestion_votes (suggestion_id, user_id) VALUES (?, ?)').run(s.id, req.user.id);

  const votes = Number(
    db.prepare('SELECT COUNT(*) n FROM suggestion_votes WHERE suggestion_id = ?').get(s.id)?.n ?? 0
  );

  // Schwelle erreicht → wandert automatisch in den Katalog.
  let promoted = null;
  if (votes >= APPROVE_THRESHOLD) {
    const slug = `c-${s.id}`;
    const already = db.prepare('SELECT 1 x FROM activities WHERE slug = ?').get(slug);
    if (!already) {
      db.prepare(
        `INSERT INTO activities (slug, name, category, icon, points, minutes, keywords, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(slug, s.name, s.category, s.icon, s.points, s.minutes, s.description.toLowerCase(), s.user_id, new Date().toISOString());
    }
    db.prepare("UPDATE suggestions SET status = 'approved' WHERE id = ?").run(s.id);
    if (s.user_id) awardBadge(db, s.user_id, 'idea_bubbler');
    promoted = true;
  }

  const row = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(s.id);
  res.json({ suggestion: shape(row, req.user.id), promoted });
});

router.delete('/:id', requireAuth, (req, res) => {
  const s = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(Number(req.params.id));
  if (!s || s.user_id !== req.user.id) return res.status(404).json({ error: 'Vorschlag nicht gefunden.' });
  if (s.status !== 'open') return res.status(400).json({ error: 'Angenommene Vorschläge bleiben bestehen.' });
  db.prepare('DELETE FROM suggestions WHERE id = ?').run(s.id);
  res.json({ ok: true });
});
