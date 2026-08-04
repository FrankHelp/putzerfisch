import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setToken, getToken } from './api.js';
import { disablePush } from './push.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [unread, setUnread] = useState(0);
  // Signal für die Muschel: "gerade ist Post angekommen" (für Nachladen + Animation).
  const [lastEvent, setLastEvent] = useState(null);
  const nextId = useRef(1);

  const toast = useCallback((text, kind = 'info') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const d = await api.post('/auth/login', { username, password });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (payload) => {
    const d = await api.post('/auth/register', payload);
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    // Push-Abo entfernen, bevor der Token erlischt – sonst bekommt der
    // nächste Nutzer auf diesem Gerät die alten Riffpost-Pushes.
    disablePush();
    setToken(null);
    setUser(null);
    setUnread(0);
    window.location.hash = '#/feed';
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!getToken()) return;
    try {
      const d = await api.get('/notifications/count');
      setUnread(d.unread);
    } catch {
      /* Zähler ist Beiwerk – ein Fehler hier darf die App nicht stören. */
    }
  }, []);

  // Riffpost kommt live über eine Dauerleitung (SSE) herein. EventSource
  // verbindet sich nach Abbrüchen von selbst neu; das Intervall unten ist nur
  // das Sicherheitsnetz für den Fall, dass die Leitung gar nicht steht.
  // Nur an der Nutzer-ID hängen: refreshUser() tauscht das Objekt aus, die
  // Leitung soll deswegen aber nicht jedes Mal neu aufgebaut werden.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    refreshUnread();

    const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
    es.addEventListener('post', (e) => {
      try {
        const d = JSON.parse(e.data);
        setUnread(d.unread);
        setLastEvent({ type: d.type, at: Date.now() });
      } catch {
        refreshUnread();
      }
    });

    const fallback = setInterval(() => {
      if (es.readyState !== EventSource.OPEN) refreshUnread();
    }, 60000);

    const onFocus = () => document.visibilityState === 'visible' && refreshUnread();
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      es.close();
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, refreshUnread]);

  const refreshUser = useCallback(async () => {
    const d = await api.get('/auth/me');
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AppCtx.Provider
      value={{
        user, setUser, booting, login, register, logout, refreshUser,
        toast, toasts, unread, setUnread, refreshUnread, lastEvent,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}
