import { db } from './db.js';

/**
 * „Die dumme Seekuh“ – Torwächterin des Ideen-Riffs.
 *
 * Jeder neue Vorschlag wird vor der Veröffentlichung von einem LLM geprüft
 * (DeepSeek-API, OpenAI-kompatibler Endpunkt). Die Seekuh antwortet NUR mit
 * einem Boolean – sie formuliert keine Antwort an den User, die Ablehnungs-
 * Texte kommen aus der App selbst (siehe routes/suggestions.js).
 *
 * Nach 3 Fehlversuchen greift ein Rate-Limit: 1 Versuch alle 30 Sekunden.
 */

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const API_URL = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 12_000;
// deepseek-v4-flash ist ein Reasoning-Modell: Es denkt erst (reasoning_content)
// und antwortet dann. max_tokens muss Reasoning + finales JSON abdecken –
// zu wenig (z. B. 16) lässt die Antwort in der Denk-Phase enden (content bleibt
// leer, finish_reason "length"). 512 reicht für beides.
const MAX_TOKENS = 512;

/** So viele Fehlversuche, bevor das Rate-Limit greift. */
export const MAX_FAILS = 3;
/** Abstand zwischen Versuchen, sobald das Limit aktiv ist. */
export const COOLDOWN_MS = 30_000;

const SYSTEM_PROMPT = `Du bist „Die dumme Seekuh“, die gutmütige, aber strenge Torwächterin des Ideen-Riffs von „Putzerfisch“, einer WG-Putz-App. Du entscheidest, ob ein vorgeschlagener Haushalts- oder Putz-Job ins Riff zur Abstimmung darf.

Der Vorschlag muss eine ECHTE Aufgabe sein: etwas, das man wirklich ausführen kann und das Sauberkeit, Ordnung oder Organisation in der WG verbessert. Witzige Formulierungen sind erlaubt – aber die Aufgabe dahinter muss real und sinnvoll sein.

Lehne ab, wenn der Vorschlag:
- rassistisch, diskriminierend, hasserfüllt oder beleidigend ist
- sexuell, gewalttätig oder sonst unangemessen ist
- ein Troll- oder Spaß-Vorschlag ist: Unsinn, Ironie, absurde „Aufgaben“, die niemand ernsthaft ausführen würde
- das Gegenteil von Putzen bewirkt (Schmutz oder Unordnung erzeugen statt beseitigen, z. B. „Aschenbecher befüllen“)
- keine echte Putz-/Haushaltsaufgabe ist (nichts mit Sauberkeit, Ordnung oder WG-Leben zu tun hat)

Nimm an, wenn dahinter eine echte, ausführbare Aufgabe steckt – auch wenn sie witzig benannt ist.

Beispiele – ANNEHMEN: „Spinnweben-Patrouille“, „Kühlschrank-Archäologie“, „Duschvorhang waschen“.
Beispiele – ABLEHNEN: „Aschenbecher befüllen für Motivation“, „Staubsauger streicheln“, „Mit dem Staubsauger tanzen“.

Antworte ausschließlich mit JSON und ohne jede weitere Erklärung oder Kommentar: {"ok": true} wenn der Vorschlag passt, {"ok": false} wenn nicht.`;

/** Moderation aktiv? Ohne API-Key läuft die App im Dev-Modus ohne Prüfung. */
export const moderationEnabled = () => !!API_KEY;

/** Liefert true (annehmen) oder false (ablehnen) – wirft bei API-Problemen. */
export async function moderateSuggestion({ name, description }) {
  if (!API_KEY) return true; // Dev-Modus: keine Seekuh ohne Schlüssel

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Name: ${name}\nBeschreibung: ${description || '(keine)'}` },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const choice = data?.choices?.[0] ?? {};
    const content = choice?.message?.content ?? '';
    const ok = parseOk(content);
    if (ok === null) {
      // Diagnose-Metadaten mithängen: finish_reason "length" heißt z. B., dass
      // max_tokens fürs Reasoning-Modell zu knapp war.
      const why = data?.error
        ? JSON.stringify(data.error).slice(0, 200)
        : `finish_reason=${choice?.finish_reason ?? '?'} content=${JSON.stringify(content).slice(0, 120)}`;
      throw new Error(`Seekuh-Antwort unlesbar: ${why}`);
    }
    return ok;
  } finally {
    clearTimeout(timer);
  }
}

/** Liest das Boolean aus der LLM-Antwort – robust gegen Format-Ausreißer. */
function parseOk(content) {
  let c = String(content ?? '').trim();
  // Code-Fences (```json … ```) abstreifen, falls das Modell sie doch setzt
  c = c.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  if (c === 'true') return true;
  if (c === 'false') return false;
  try {
    const j = JSON.parse(c);
    if (typeof j?.ok === 'boolean') return j.ok;
  } catch {
    /* kein JSON – Regex-Fallback unten */
  }
  const m = c.match(/"ok"\s*:\s*(true|false)/);
  if (m) return m[1] === 'true';
  return null;
}

/**
 * Rate-Limit-Check: nach MAX_FAILS Fehlversuchen ist nur 1 Versuch pro
 * COOLDOWN_MS erlaubt. Gibt { allowed: false, retryAfter } in Sekunden zurück.
 */
export function rateLimitCheck(userId) {
  const last = db
    .prepare('SELECT accepted, fail_streak, created_at FROM seacow_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    .get(userId);
  if (!last || last.accepted || last.fail_streak < MAX_FAILS) return { allowed: true };

  const elapsed = Date.now() - new Date(last.created_at).getTime();
  if (elapsed >= COOLDOWN_MS) return { allowed: true };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((COOLDOWN_MS - elapsed) / 1000)) };
}

/**
 * Speichert einen Moderation-Versuch. Liefert die aktuelle Fehlerserie
 * (fail_streak): zählt aufeinanderfolgende Ablehnungen, setzt sich bei
 * Annahme zurück. Grundlage für das Rate-Limit.
 */
export function recordAttempt(userId, accepted) {
  const last = db
    .prepare('SELECT accepted, fail_streak FROM seacow_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    .get(userId);
  const streak = accepted ? 0 : (last && !last.accepted ? last.fail_streak : 0) + 1;
  db.prepare('INSERT INTO seacow_attempts (user_id, accepted, fail_streak, created_at) VALUES (?, ?, ?, ?)').run(
    userId,
    accepted ? 1 : 0,
    streak,
    new Date().toISOString()
  );
  return streak;
}
