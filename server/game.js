// Spiel-Logik: Ränge, Level, Boni, Badges, Riff-Sauberkeit

export const RANKS = [
  { level: 1,  xp: 0,     name: 'Planktonputzer',    fish: '🦠', blurb: 'Jeder fängt klein an.' },
  { level: 2,  xp: 30,   name: 'Putzerfisch-Larve', fish: '🐟', blurb: 'Erste Schuppen poliert.' },
  { level: 3,  xp: 120,   name: 'Jungputzer',        fish: '🐠', blurb: 'Der Schwamm sitzt locker.' },
  { level: 4,  xp: 350,   name: 'Riffreiniger',      fish: '🐡', blurb: 'Das Riff atmet auf.' },
  { level: 5,  xp: 680,  name: 'Schuppenpolierer',  fish: '🐬', blurb: 'Glanz auf Bestellung.' },
  { level: 6,  xp: 1150,  name: 'Korallenwächter',   fish: '🪸', blurb: 'Kein Fleck kommt durch.' },
  { level: 7,  xp: 1700,  name: 'Blasenmeister',     fish: '🫧', blurb: 'Schaum ist deine Sprache.' },
  { level: 8,  xp: 2400,  name: 'Riff-Sheriff',      fish: '🦈', blurb: 'Du putzt mit Autorität.' },
  { level: 9,  xp: 3300,  name: 'Tiefsee-Schrubber', fish: '🐙', blurb: 'Acht Arme, null Dreck.' },
  { level: 10, xp: 4200,  name: 'Großer Putzerfisch',fish: '🐋', blurb: 'Legendäre Ausdauer.' },
  { level: 11, xp: 5400, name: 'Herrscher des Riffs',fish: '🔱', blurb: 'Das Meer gehorcht dir.' },
  { level: 12, xp: 6700, name: 'Legende der Lagune',fish: '👑', blurb: 'Über dir nur noch Wasser.' },
];


export function rankFor(xp) {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.xp) current = r;
  const next = RANKS.find((r) => r.xp > xp) || null;
  const span = next ? next.xp - current.xp : 1;
  const done = next ? xp - current.xp : 1;
  return {
    ...current,
    nextName: next?.name ?? null,
    nextXp: next?.xp ?? null,
    toNext: next ? next.xp - xp : 0,
    progress: next ? Math.min(1, done / span) : 1,
  };
}

// ---- Badges ------------------------------------------------------------
export const BADGES = {
  first_splash:   { icon: '💦', name: 'Erster Schwung',   desc: 'Deine allererste Putzaktion.' },
  streak_3:       { icon: '🔥', name: 'Warmgelaufen',     desc: '3 Tage Serie am Stück.' },
  streak_7:       { icon: '🌊', name: 'Wellenreiter',     desc: '7 Tage Serie am Stück.' },
  streak_30:      { icon: '🏄', name: 'Gezeitenmeister',  desc: '30 Tage Serie am Stück.' },
  night_owl:      { icon: '🦉', name: 'Nachtschwärmer',   desc: 'Nach 23 Uhr geputzt.' },
  early_fish:     { icon: '🌅', name: 'Frühschwimmer',    desc: 'Vor 7 Uhr geputzt.' },
  kitchen_boss:   { icon: '🍳', name: 'Kombüsen-Chef',    desc: '10× in der Küche geputzt.' },
  tile_king:      { icon: '👑', name: 'Kachelkönig',      desc: '10× das Bad gemacht.' },
  trash_tycoon:   { icon: '♻️', name: 'Strandgut-Magnat', desc: '20× Müll entsorgt.' },
  all_rounder:    { icon: '🧭', name: 'Allrounder',       desc: 'In allen 8 Kategorien aktiv.' },
  big_one:        { icon: '🐋', name: 'Wal-Aktion',       desc: 'Eine Aktion mit 50+ Punkten.' },
  social_fish:    { icon: '💬', name: 'Schwarmfisch',     desc: '25 Kommentare geschrieben.' },
  idea_bubbler:   { icon: '💡', name: 'Ideensprudler',    desc: 'Ein Vorschlag wurde angenommen.' },
  reef_saver:     { icon: '🪸', name: 'Riff-Retter',      desc: '5.000 XP erreicht.' },
  century:        { icon: '💯', name: 'Hundertschaft',    desc: '100 Putzaktionen geloggt.' },
};

export function awardBadge(db, userId, code) {
  const res = db
    .prepare('INSERT OR IGNORE INTO badges (user_id, code, created_at) VALUES (?, ?, ?)')
    .run(userId, code, new Date().toISOString());
  return Number(res.changes) > 0 ? { code, ...BADGES[code] } : null;
}

/**
 * Gleicht die Badges eines Users mit dem aktuellen Stand ab: vergibt neu
 * verdiente Badges und entzieht welche, deren Bedingung nicht mehr erfüllt
 * ist (z. B. nach dem Zurücknehmen einer Aktivität). Zustandsbasiert aus der
 * DB statt kontextbasiert – so bleiben Badges und Wirklichkeit synchron.
 * Gibt die neu vergebenen Badges zurück.
 */
export function syncBadges(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return [];

  const logs = db.prepare('SELECT created_at, category, points FROM logs WHERE user_id = ?').all(userId);
  const comments = Number(db.prepare('SELECT COUNT(*) n FROM comments WHERE user_id = ?').get(userId)?.n ?? 0);
  const approvedIdea = db.prepare("SELECT 1 x FROM suggestions WHERE user_id = ? AND status = 'approved'").get(userId);

  const total = logs.length;
  const categories = new Set(logs.map((l) => l.category)).size;
  const byCat = (c) => logs.filter((l) => l.category === c).length;
  const night = logs.some((l) => {
    const h = berlinHourOf(new Date(l.created_at));
    return h >= 23 || h < 2;
  });
  const early = logs.some((l) => {
    const h = berlinHourOf(new Date(l.created_at));
    return h >= 4 && h < 7;
  });
  const big = logs.some((l) => l.points >= 50);

  const earned = new Set();
  if (total >= 1) earned.add('first_splash');
  if (total >= 100) earned.add('century');
  if (user.streak >= 3) earned.add('streak_3');
  if (user.streak >= 7) earned.add('streak_7');
  if (user.streak >= 30) earned.add('streak_30');
  if (user.xp >= 5000) earned.add('reef_saver');
  if (night) earned.add('night_owl');
  if (early) earned.add('early_fish');
  if (big) earned.add('big_one');
  if (byCat('kombuese') >= 10) earned.add('kitchen_boss');
  if (byCat('riffspalte') >= 10) earned.add('tile_king');
  if (byCat('strandgut') >= 20) earned.add('trash_tycoon');
  if (categories >= 8) earned.add('all_rounder');
  if (comments >= 25) earned.add('social_fish');
  if (approvedIdea) earned.add('idea_bubbler');

  const newly = [];
  for (const code of earned) {
    const b = awardBadge(db, userId, code);
    if (b) newly.push(b);
  }

  // Entzug: nur bekannte Badges, deren Bedingung nicht mehr erfüllt ist.
  for (const row of db.prepare('SELECT code FROM badges WHERE user_id = ?').all(userId)) {
    if (BADGES[row.code] && !earned.has(row.code)) {
      db.prepare('DELETE FROM badges WHERE user_id = ? AND code = ?').run(userId, row.code);
    }
  }

  return newly;
}

// ---- Streak & Boni -----------------------------------------------------
// Tagesgrenzen in fester Server-Zeitzone Europe/Berlin (Spec: keine Pro-User-Zeitzonen).
const BERLIN_TZ = 'Europe/Berlin';
const berlinDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: BERLIN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Berliner Kalendertag als YYYY-MM-DD. */
export const dayKey = (d = new Date()) => {
  const p = berlinDate.formatToParts(d);
  const g = (t) => p.find((x) => x.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')}`;
};

/** UTC-Grenzen [start, end) eines Berliner Kalendertags als ISO-Strings. */
export function berlinDayRange(dateStr = dayKey()) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return [
    new Date(berlinMidnightUTC(y, m, d)).toISOString(),
    new Date(berlinMidnightUTC(y, m, d + 1)).toISOString(),
  ];
}

/** UTC-Timestamp von 00:00 Uhr an einem Berliner Kalendertag (UTC+1/+2 → 22:00/23:00 UTC des Vortags). */
function berlinMidnightUTC(y, m, d) {
  const want = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const h of [22, 23]) {
    const ts = Date.UTC(y, m - 1, d - 1, h, 0, 0, 0);
    if (dayKey(new Date(ts)) === want) return ts;
  }
  return Date.UTC(y, m - 1, d - 1, 23, 0, 0, 0);
}

/** Berliner Stunde (0–23) eines Zeitpunkts – für Zeitfenster-Badges. */
export function berlinHourOf(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: BERLIN_TZ, hour: '2-digit', hour12: false }).formatToParts(d);
  return Number(p.find((x) => x.type === 'hour')?.value ?? 0) % 24;
}

export function updateStreak(db, user) {
  const today = dayKey();
  if (user.last_clean_day === today) return { streak: user.streak, changed: false };

  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const streak = user.last_clean_day === yesterday ? user.streak + 1 : 1;
  const best = Math.max(streak, user.best_streak);
  db.prepare('UPDATE users SET streak = ?, best_streak = ?, last_clean_day = ? WHERE id = ?')
    .run(streak, best, today, user.id);
  return { streak, changed: true };
}

/**
 * Aktuelle, wirklich lebendige Streak: nur wenn zuletzt heute oder gestern
 * geputzt wurde. Ist die Serie abgerissen (letzter Putztag älter), gilt sie
 * als inaktiv → 0, damit die UI sie nirgends mehr anzeigt (Chip, Profil,
 * Ranglisten). Der gespeicherte Wert bleibt unangetastet – Serien-Bonus und
 * Verlängerung in updateStreak rechnen weiter mit dem Rohwert.
 */
export function activeStreak(u) {
  if (!u?.last_clean_day) return 0;
  if (u.last_clean_day === dayKey()) return u.streak;
  if (u.last_clean_day === dayKey(new Date(Date.now() - 86400000))) return u.streak;
  return 0;
}

/**
 * Berechnet die finalen Punkte inkl. Boni.
 * Boni sind multiplikativ auf die Basispunkte und werden dem Nutzer transparent gezeigt.
 */
export function computePoints(db, user, activity, streak) {
  const bonuses = [];
  let mult = 1;

  // Serien-Bonus: +5% pro Streak-Tag, max +50%
  const streakBonus = Math.min(0.5, Math.max(0, streak - 1) * 0.05);
  if (streakBonus > 0) {
    mult += streakBonus;
    bonuses.push({ icon: '🔥', label: `${streak}-Tage-Serie`, value: `+${Math.round(streakBonus * 100)}%` });
  }

  // Früher Vogel im Riff: erste Aktion des Tages in der WG
  if (user.wg_id) {
    const [from, to] = berlinDayRange();
    const firstToday = db
      .prepare('SELECT COUNT(*) n FROM logs WHERE wg_id = ? AND created_at >= ? AND created_at < ?')
      .get(user.wg_id, from, to);
    if (Number(firstToday.n) === 0) {
      mult += 0.2;
      bonuses.push({ icon: '🌅', label: 'Erster im Riff heute', value: '+20%' });
    }
  }

  // Vernachlässigte Zone: Kategorie seit 14 Tagen nicht angefasst (WG oder solo)
  const scope = user.wg_id
    ? db.prepare(
        "SELECT MAX(created_at) last FROM logs WHERE wg_id = ? AND category = ?"
      ).get(user.wg_id, activity.category)
    : db.prepare(
        "SELECT MAX(created_at) last FROM logs WHERE user_id = ? AND category = ?"
      ).get(user.id, activity.category);
  if (scope?.last && Date.now() - new Date(scope.last).getTime() > 14 * 86400000) {
    mult += 0.3;
    bonuses.push({ icon: '🧭', label: 'Vergessene Zone', value: '+30%' });
  }

  // Wochenend-Krieger
  const dow = new Date().getDay();
  if (dow === 0 || dow === 6) {
    mult += 0.1;
    bonuses.push({ icon: '🏖️', label: 'Wochenend-Krieger', value: '+10%' });
  }

  const points = Math.max(1, Math.round(activity.points * mult));
  return { points, bonuses, mult };
}

/** Riff-Sauberkeit einer WG: 0–100, basierend auf den letzten 7 Tagen pro Kopf. */
export function reefHealth(db, wgId) {
  const members = Number(
    db.prepare('SELECT COUNT(*) n FROM users WHERE wg_id = ?').get(wgId)?.n ?? 0
  );
  if (!members) return { score: 0, members: 0, points7d: 0, state: reefState(0) };
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const points = Number(
    db.prepare('SELECT COALESCE(SUM(points),0) s FROM logs WHERE wg_id = ? AND created_at >= ?')
      .get(wgId, since)?.s ?? 0
  );
  const target = members * 220; // Zielwert pro Kopf und Woche
  const score = Math.max(0, Math.min(100, Math.round((points / target) * 100)));
  return { score, members, points7d: points, state: reefState(score) };
}

export function reefState(score) {
  if (score >= 85) return { label: 'Kristallklar', icon: '✨', color: '#2ee6d6' };
  if (score >= 60) return { label: 'Frisch',       icon: '🐠', color: '#4ade80' };
  if (score >= 35) return { label: 'Trüb',         icon: '🌫️', color: '#fcd34d' };
  if (score >= 15) return { label: 'Algig',        icon: '🦠', color: '#fb923c' };
  return { label: 'Sumpf', icon: '🫠', color: '#f87171' };
}
