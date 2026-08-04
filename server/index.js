import express from 'express';
import cors from 'cors';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { router as authRoutes } from './routes/auth.js';
import { router as activityRoutes } from './routes/activities.js';
import { router as feedRoutes, commentRouter, metaRouter } from './routes/feed.js';
import { router as leaderboardRoutes } from './routes/leaderboard.js';
import { router as wgRoutes } from './routes/wg.js';
import { router as suggestionRoutes } from './routes/suggestions.js';
import { router as userRoutes } from './routes/users.js';
import { router as notificationRoutes } from './routes/notifications.js';
import { RANKS, BADGES } from './game.js';
import { CATEGORIES } from './catalog.js';
import { uploadsDir } from './storage.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 4321);

app.use(cors());
app.use(express.json({ limit: '4mb' })); // großzügig: Fotos kommen als base64-JSON

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/comments', commentRouter);
app.use('/api/meta', metaRouter);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/wg', wgRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/meta/game', (_req, res) => res.json({ ranks: RANKS, badges: BADGES, categories: CATEGORIES }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---- Bilder ausliefern (lokal gespeichert, siehe storage.js) -------------
app.use('/uploads', express.static(uploadsDir));

// ---- Frontend ausliefern (Produktion) ----------------------------------
const dist = path.join(here, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unbekannter Endpunkt.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Foto ist zu groß.' });
  console.error(err);
  res.status(500).json({ error: 'Da ist im Riff was schiefgelaufen.' });
});

/** Alle LAN-IPv4-Adressen, damit das Handy weiß, wohin. */
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
}

app.listen(PORT, '0.0.0.0', () => {
  const serving = fs.existsSync(dist);
  console.log(`\n🐠 Putzerfisch ${serving ? '(API + Frontend)' : '(nur API)'} lauscht auf 0.0.0.0:${PORT}\n`);
  console.log(`   Lokal:     http://localhost:${PORT}`);
  for (const ip of lanAddresses()) console.log(`   Im Netz:   http://${ip}:${PORT}`);
  if (!serving) {
    console.log('\n   Frontend läuft separat: "npm run dev" (Vite auf Port 5173).');
  }
  console.log('\n   Handy: gleiches WLAN, dann eine der "Im Netz"-Adressen öffnen.');
  console.log('   Falls das Handy nicht durchkommt, blockt meist die Windows-Firewall.\n');
});
