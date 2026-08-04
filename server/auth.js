import crypto from 'node:crypto';
import { db } from './db.js';

// Signier-Secret: aus der Umgebung, sonst einmalig generiert und in der DB
// abgelegt – so überleben ausgestellte Tokens einen Server-Neustart.
db.exec('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');

const secret = (() => {
  if (process.env.PUTZAPP_SECRET) return process.env.PUTZAPP_SECRET;
  const existing = db.prepare("SELECT value FROM kv WHERE key = 'secret'").get();
  if (existing) return existing.value;
  const fresh = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?)').run('secret', fresh);
  return fresh;
})();

const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 Tage

const b64u = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, keyHex] = stored.split('$');
    if (scheme !== 'scrypt') return false;
    const key = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
  } catch {
    return false;
  }
}

export function signToken(payload) {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL })
  );
  const sig = b64u(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest();
    const given = unb64u(sig);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const payload = JSON.parse(unb64u(body).toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const bearer = (req) => {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const userForToken = (token) => {
  const payload = token && verifyToken(token);
  return payload ? db.prepare('SELECT * FROM users WHERE id = ?').get(payload.uid) : null;
};

/** Express-Middleware: hängt req.user an (oder 401). */
export function requireAuth(req, res, next) {
  const token = bearer(req);
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'Nicht eingeloggt.' });
  const user = userForToken(token);
  if (!user) return res.status(401).json({ error: 'Nutzer existiert nicht mehr.' });
  req.user = user;
  next();
}

/**
 * Wie requireAuth, nimmt den Token aber auch aus ?token= entgegen.
 * Nur für den SSE-Strom: EventSource kann keine eigenen Header senden.
 * Absichtlich nicht global – Tokens in URLs landen sonst in jedem Logfile.
 */
export function requireAuthQuery(req, res, next) {
  const token = bearer(req) || String(req.query.token || '') || null;
  const user = userForToken(token);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt.' });
  req.user = user;
  next();
}

/** Wie requireAuth, aber ohne Fehler wenn kein Token da ist. */
export function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  req.user = payload ? db.prepare('SELECT * FROM users WHERE id = ?').get(payload.uid) : null;
  next();
}
