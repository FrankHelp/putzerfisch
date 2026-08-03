const TOKEN_KEY = 'putzerfisch.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Keine Verbindung zum Riff. Läuft der Server?', 0);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ApiError(data.error || 'Etwas ist schiefgelaufen.', res.status);
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body: body ?? {} }),
  patch: (p, body) => request(p, { method: 'PATCH', body: body ?? {} }),
  del: (p) => request(p, { method: 'DELETE' }),
};

// ---- Formatierung ------------------------------------------------------
export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'gerade eben';
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'gestern';
  if (d < 7) return `vor ${d} Tagen`;
  const w = Math.floor(d / 7);
  if (w < 5) return `vor ${w} Wo.`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

export const num = (n) => (n ?? 0).toLocaleString('de-DE');
