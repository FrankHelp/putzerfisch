/**
 * Füllt die Datenbank mit Demo-Daten, damit Feed und Leaderboards nicht leer sind.
 * Start:  npm run seed:demo
 * Alle Demo-Accounts haben das Passwort "putzen123".
 */
import { db } from './db.js';
import { hashPassword } from './auth.js';
import { syncBadges, computePoints } from './game.js';
import { REACTIONS } from './routes/feed.js';

const PASSWORD = 'putzen123';
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const iso = (daysAgo, hour = 12) =>
  new Date(Date.now() - daysAgo * 86400000 - (23 - hour) * 3600000).toISOString();

const PEOPLE = [
  { username: 'nala',    displayName: 'Nala',      fish: '🐠', color: '#2ee6d6', wg: 'riff' },
  { username: 'jonas',   displayName: 'Jonas',     fish: '🐡', color: '#ffb45c', wg: 'riff' },
  { username: 'mira',    displayName: 'Mira',      fish: '🪼', color: '#a78bfa', wg: 'riff' },
  { username: 'tobi',    displayName: 'Tobi',      fish: '🦈', color: '#5ad1ff', wg: 'riff' },
  { username: 'lea',     displayName: 'Lea',       fish: '🐢', color: '#4ade80', wg: 'lagune' },
  { username: 'ben',     displayName: 'Ben',       fish: '🦀', color: '#fb7185', wg: 'lagune' },
  { username: 'sophie',  displayName: 'Sophie',    fish: '🐬', color: '#f472b6', wg: 'lagune' },
  { username: 'kai',     displayName: 'Kai',       fish: '🐙', color: '#fcd34d', wg: null },
  { username: 'yara',    displayName: 'Yara',      fish: '🦐', color: '#2ee6d6', wg: null },
];

const WGS = {
  riff: { name: 'Korallenriff 3b', emblem: '🪸', motto: 'Sauber ist ein Zustand, kein Zufall.', code: 'RIFF23' },
  lagune: { name: 'Blaue Lagune', emblem: '🌊', motto: 'Wir schrubben, also sind wir.', code: 'LAGUNE' },
};

const COMMENTS = [
  'Respekt, das war überfällig 👏',
  'Ich hab es gesehen. Es glänzt WIRKLICH.',
  'Wer hat den Schwamm zuletzt gesehen?',
  'Das nächste Mal bin ich dran, versprochen.',
  'Legendär. Denkmal wann?',
  'Bitte mach das nochmal, das war Kunst.',
  'Der Abfluss dankt dir persönlich.',
  'Ich rieche es bis in mein Zimmer 🌸',
  'Und ich dachte, das Ding wäre grau...',
  'Punkte absolut verdient.',
  'Ok das setzt neue Maßstäbe im Riff.',
  'Ich hätte das ignoriert, ehrlich.',
];

const NOTES = [
  '',
  '',
  '',
  'War schlimmer als erwartet.',
  'Musste zweimal ran.',
  'Mit Musik geht alles besser 🎧',
  'Nie wieder Pfannen einweichen lassen.',
  'Hab dabei drei Socken gefunden.',
];

function reset() {
  for (const t of ['comment_votes', 'comments', 'reactions', 'suggestion_votes', 'suggestions', 'badges', 'logs']) {
    db.exec(`DELETE FROM ${t}`);
  }
  db.exec("DELETE FROM activities WHERE created_by IS NOT NULL");
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM wgs');
}

console.log('🧽 Räume die Datenbank auf …');
reset();

// ---- WGs ----
const wgIds = {};
for (const [key, wg] of Object.entries(WGS)) {
  const info = db
    .prepare('INSERT INTO wgs (name, invite_code, emblem, motto, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(wg.name, wg.code, wg.emblem, wg.motto, iso(40));
  wgIds[key] = Number(info.lastInsertRowid);
}

// ---- Nutzer ----
const hash = hashPassword(PASSWORD);
const userIds = {};
for (const p of PEOPLE) {
  const info = db
    .prepare(
      `INSERT INTO users (username, display_name, password_hash, fish, color, wg_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(p.username, p.displayName, hash, p.fish, p.color, p.wg ? wgIds[p.wg] : null, iso(35));
  userIds[p.username] = Number(info.lastInsertRowid);
}

// ---- Putz-Historie der letzten 30 Tage ----
const activities = db.prepare('SELECT * FROM activities').all();

for (const p of PEOPLE) {
  const uid = userIds[p.username];
  const eagerness = 0.3 + Math.random() * 0.6; // wie fleißig diese Person ist
  let streak = 0;
  let lastDay = null;

  for (let d = 30; d >= 0; d--) {
    if (Math.random() > eagerness) continue;
    const actionsToday = 1 + (Math.random() < 0.3 ? 1 : 0);
    const day = iso(d).slice(0, 10);
    streak = lastDay === iso(d + 1).slice(0, 10) ? streak + 1 : 1;
    lastDay = day;

    for (let k = 0; k < actionsToday; k++) {
      const a = rnd(activities);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      const { points, bonuses } = computePoints(db, user, a, streak);
      const at = iso(d, 8 + Math.floor(Math.random() * 14));
      db.prepare(
        `INSERT INTO logs (user_id, wg_id, activity_id, activity_name, icon, category,
                           base_points, points, minutes, note, bonuses, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(uid, user.wg_id, a.id, a.name, a.icon, a.category, a.points, points, a.minutes, rnd(NOTES), JSON.stringify(bonuses), at);
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(points, uid);
    }
  }
  db.prepare('UPDATE users SET streak = ?, best_streak = ?, last_clean_day = ? WHERE id = ?')
    .run(streak, streak + Math.floor(Math.random() * 4), lastDay, uid);
}

// ---- Reaktionen & Kommentare ----
const allUserIds = Object.values(userIds);
// Nach Zeitstempel auswählen, nicht nach Einfüge-Reihenfolge – sonst hätten
// ausgerechnet die obersten Feed-Einträge weder Reaktionen noch Kommentare.
const recentLogs = db
  .prepare('SELECT id FROM logs ORDER BY created_at DESC LIMIT 70')
  .all()
  .map((r) => r.id);

// Riffpost entsteht hier gleich mit: alles, was älter als zwei Tage ist,
// gilt als gelesen – so hat die Muschel beim ersten Blick ein paar frische
// Perlen, ohne dass es nach hunderten Altlasten aussieht.
const FRESH_AFTER = Date.now() - 2 * 86400000;
const addNotification = (userId, actorId, type, logId, commentId, emoji, at) => {
  if (userId === actorId) return;
  db.prepare(
    `INSERT INTO notifications (user_id, actor_id, type, log_id, comment_id, emoji, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, actorId, type, logId, commentId, emoji, new Date(at).getTime() > FRESH_AFTER ? null : at, at);
};

for (const logId of recentLogs) {
  const log = db.prepare('SELECT * FROM logs WHERE id = ?').get(logId);
  const reactors = allUserIds.filter((id) => id !== log.user_id && Math.random() < 0.45);
  for (const uid of reactors) {
    const emoji = rnd(REACTIONS);
    db.prepare('INSERT OR IGNORE INTO reactions (log_id, user_id, emoji) VALUES (?, ?, ?)')
      .run(logId, uid, emoji);
    // Reaktionen tragen keinen eigenen Zeitstempel – kurz nach dem Eintrag ist plausibel.
    const at = new Date(new Date(log.created_at).getTime() + 1800000 + Math.random() * 7200000).toISOString();
    addNotification(log.user_id, uid, 'reaction', logId, null, emoji, at);
  }

  if (Math.random() < 0.4) {
    const commenters = allUserIds.filter((id) => id !== log.user_id && Math.random() < 0.35).slice(0, 3);
    const seenInThread = [];
    for (const uid of commenters) {
      const at = new Date(new Date(log.created_at).getTime() + 3600000).toISOString();
      const info = db
        .prepare('INSERT INTO comments (log_id, user_id, text, created_at) VALUES (?, ?, ?, ?)')
        .run(logId, uid, rnd(COMMENTS), at);
      const cid = Number(info.lastInsertRowid);

      addNotification(log.user_id, uid, 'comment', logId, cid, null, at);
      // Mitschwimmer: wer vorher schon im Thread war, bekommt Bescheid.
      for (const earlier of seenInThread) addNotification(earlier, uid, 'thread', logId, cid, null, at);
      seenInThread.push(uid);

      for (const voter of allUserIds) {
        if (voter !== uid && Math.random() < 0.3)
          db.prepare('INSERT OR IGNORE INTO comment_votes (comment_id, user_id) VALUES (?, ?)').run(cid, voter);
      }
    }
  }
}

// ---- Vorschläge ----
const SUGGESTIONS = [
  { name: 'Duschvorhang waschen', category: 'bad', icon: '🛁', points: 22, minutes: 15, description: 'Der Vorhang wird nie gewaschen und irgendwann eigenständig.', votes: 4, by: 'mira' },
  { name: 'Toaster ausklopfen', category: 'kueche', icon: '🍞', points: 10, minutes: 5, description: 'Krümelfach leeren, bevor es brennt.', votes: 3, by: 'jonas' },
  { name: 'Spinnweben-Patrouille', category: 'wohnen', icon: '🕸️', points: 18, minutes: 12, description: 'Alle Zimmerecken einmal abgehen.', votes: 2, by: 'kai' },
  { name: 'Kühlschrank-Archäologie', category: 'kueche', icon: '🦴', points: 30, minutes: 25, description: 'Alles entsorgen, was älter ist als die WG selbst.', votes: 4, by: 'lea' },
  { name: 'Fußmatte ausschütteln', category: 'aussen', icon: '🚪', points: 8, minutes: 4, description: 'Kleine Geste, große Wirkung.', votes: 1, by: 'ben' },
  { name: 'Lichtschalter entfetten', category: 'extra', icon: '💡', points: 12, minutes: 8, description: 'Man sieht es nicht, man fühlt es.', votes: 2, by: 'yara' },
];

for (const s of SUGGESTIONS) {
  const info = db
    .prepare(
      `INSERT INTO suggestions (user_id, name, category, icon, points, minutes, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userIds[s.by], s.name, s.category, s.icon, s.points, s.minutes, s.description, iso(Math.floor(Math.random() * 10)));
  const sid = Number(info.lastInsertRowid);
  const voters = [userIds[s.by], ...allUserIds.filter((id) => id !== userIds[s.by])].slice(0, s.votes);
  for (const uid of voters)
    db.prepare('INSERT OR IGNORE INTO suggestion_votes (suggestion_id, user_id) VALUES (?, ?)').run(sid, uid);
}

// ---- Badges nachrechnen ----
for (const uid of allUserIds) syncBadges(db, uid);

const stats = db.prepare('SELECT COUNT(*) n FROM logs').get();
const post = db.prepare('SELECT COUNT(*) n FROM notifications').get();
console.log(`✅ Fertig: ${PEOPLE.length} Nutzer, ${Object.keys(WGS).length} WGs, ${stats.n} Putzaktionen, ${post.n} Riffpost-Einträge.`);
console.log(`   Login z.B.:  nala / ${PASSWORD}`);
console.log(`   WG-Codes:    RIFF23, LAGUNE`);
