import { useSyncExternalStore, useCallback } from 'react';

/**
 * Winziger Hash-Router. Bewusst ohne Abhängigkeit:
 * fünf Tabs plus ein paar Detailseiten – und der Zurück-Button
 * des Handys funktioniert dank History ganz von allein.
 */

const read = () => window.location.hash.replace(/^#/, '') || '/feed';

const subscribe = (cb) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute() {
  const path = useSyncExternalStore(subscribe, read, () => '/feed');
  const [, head = 'feed', param = null] = path.split('/');
  return { path, view: head, param };
}

export function useNavigate() {
  return useCallback((to, { replace = false } = {}) => {
    const target = `#${to.startsWith('/') ? to : `/${to}`}`;
    if (replace) window.location.replace(target);
    else window.location.hash = target;
    window.scrollTo({ top: 0 });
  }, []);
}

export const navigate = (to) => {
  window.location.hash = `#${to.startsWith('/') ? to : `/${to}`}`;
  window.scrollTo({ top: 0 });
};
