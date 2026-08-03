// Lokale Bild-Ablage (Spec: kein externer Object-Storage).
// Ablage: uploads/<YYYY-MM-DD>/<userId>_<zufall>.jpg — nach Datum für einfache Backups.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = process.env.PUTZAPP_UPLOADS || path.join(here, 'uploads');

const MAX_BYTES = 2.5 * 1024 * 1024; // Ein 1512px-JPEG passt locker darunter.

/**
 * Speichert ein JPEG (data:image/jpeg;base64, …) unter uploads/ und
 * gibt die öffentliche URL zurück. Ohne Foto: null. Bei Müll: Fehler.
 */
export function savePhoto(dataUrl, userId) {
  if (!dataUrl) return null;
  const m = /^data:image\/jpeg;base64,([\w+/=]+)$/.exec(String(dataUrl));
  if (!m) throw new Error('Foto muss als JPEG (data:image/jpeg) ankommen.');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 8) throw new Error('Das Foto ist leer.');
  if (buf.length > MAX_BYTES) throw new Error('Foto ist zu groß (max. ~2,5 MB).');
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff)
    throw new Error('Das ist keine gültige JPEG-Datei.');

  const day = new Date().toISOString().slice(0, 10); // Ordner pro Tag (UTC reicht für Ablage)
  const dir = path.join(uploadsDir, day);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${userId}_${crypto.randomBytes(6).toString('hex')}.jpg`;
  fs.writeFileSync(path.join(dir, name), buf);
  return `/uploads/${day}/${name}`;
}

/** Löscht eine unter /uploads/ liegende Datei (wenn vorhanden). */
export function deletePhoto(url) {
  if (!url) return;
  const rel = String(url).replace(/^\/uploads\//, '');
  const file = path.resolve(uploadsDir, rel);
  if (!file.startsWith(path.resolve(uploadsDir) + path.sep)) return; // Traversal-Schutz
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
