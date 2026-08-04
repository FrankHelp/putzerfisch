/**
 * Live-Strömung: ein winziger Server-Sent-Events-Verteiler.
 *
 * Bewusst kein WebSocket – die Riffpost fließt nur in eine Richtung, und
 * EventSource bringt Wiederverbindung schon von Haus aus mit. Kein Paket,
 * kein Handshake, keine zusätzliche Abhängigkeit.
 */

/** userId -> Set der offenen Antwortströme (ein Mensch, mehrere Geräte). */
const clients = new Map();

const HEARTBEAT_MS = 25000;

/** Hängt eine Antwort als Dauerleitung ein. Gibt die Abmeldung zurück. */
export function subscribe(userId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // falls doch mal ein Proxy davor steht
  });
  res.flushHeaders?.();
  // Erste Zeile sofort raus, sonst wartet der Browser auf den Header-Flush.
  res.write('retry: 3000\n\n');

  let set = clients.get(userId);
  if (!set) clients.set(userId, (set = new Set()));
  set.add(res);

  const beat = setInterval(() => {
    // Kommentarzeile: hält die Leitung offen, löst beim Client nichts aus.
    try {
      res.write(': ping\n\n');
    } catch {
      close();
    }
  }, HEARTBEAT_MS);

  const close = () => {
    clearInterval(beat);
    const current = clients.get(userId);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) clients.delete(userId);
  };

  res.on('close', close);
  res.on('error', close);
  return close;
}

/** Schickt ein Ereignis an alle Geräte einer Person. */
export function publish(userId, event, data) {
  const set = clients.get(userId);
  if (!set?.size) return;
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of [...set]) {
    try {
      res.write(frame);
    } catch {
      set.delete(res);
    }
  }
}

/** Nur fürs Debugging: wie viele Leitungen liegen gerade an? */
export const streamStats = () => ({
  users: clients.size,
  connections: [...clients.values()].reduce((n, s) => n + s.size, 0),
});
