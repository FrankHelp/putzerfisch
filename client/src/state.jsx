import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setToken, getToken } from './api.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
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
    setToken(null);
    setUser(null);
    window.location.hash = '#/feed';
  }, []);

  const refreshUser = useCallback(async () => {
    const d = await api.get('/auth/me');
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AppCtx.Provider value={{ user, setUser, booting, login, register, logout, refreshUser, toast, toasts }}>
      {children}
    </AppCtx.Provider>
  );
}
