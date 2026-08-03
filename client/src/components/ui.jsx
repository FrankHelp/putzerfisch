import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state.jsx';

/* ---------- Ozean-Hintergrund mit aufsteigenden Blasen ---------- */
export function Ocean() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const size = 5 + Math.random() * 20;
        return {
          key: i,
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          animationDuration: `${11 + Math.random() * 16}s`,
          animationDelay: `${-Math.random() * 22}s`,
        };
      }),
    []
  );
  return (
    <>
      <div className="ocean" />
      <div className="bubbles" aria-hidden="true">
        {bubbles.map(({ key, ...style }) => (
          <span key={key} className="bubble" style={style} />
        ))}
      </div>
    </>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ fish = '🐠', color = '#2ee6d6', size = 40, level, onClick }) {
  return (
    <div
      className="avatar"
      onClick={onClick}
      style={{
        '--av-color': color,
        width: size,
        height: size,
        fontSize: size * 0.52,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <span>{fish}</span>
      {level != null && <span className="lvl">{level}</span>}
    </div>
  );
}

/* ---------- XP-Leiste ---------- */
export function XPBar({ progress }) {
  return (
    <div className="xpbar">
      <i style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
    </div>
  );
}

/* ---------- Bottom-Sheet ---------- */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
export function Toasts() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind === 'err' ? 'err' : ''}`}>
          <span>{t.kind === 'err' ? '⚠️' : '🫧'}</span>
          <span className="grow">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Leerer Zustand ---------- */
export function Empty({ emoji = '🐠', title, text, children }) {
  return (
    <div className="empty">
      <span className="em">{emoji}</span>
      <div className="t">{title}</div>
      {text && <div className="d">{text}</div>}
      {children && <div className="mt">{children}</div>}
    </div>
  );
}

/* ---------- Ladeplatzhalter ---------- */
export const Skeletons = ({ n = 3, height = 118 }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="skeleton" style={{ height }} />
    ))}
  </>
);

/* ---------- Zahl, die hochzählt ---------- */
export function CountUp({ to, duration = 900, prefix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out-cubic
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <>
      {prefix}
      {n}
    </>
  );
}

/* ---------- Konfetti aus Emojis ---------- */
export function Confetti({ pieces = ['🫧', '✨', '🐠', '💧', '🧽', '⭐'], count = 26 }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        char: pieces[i % pieces.length],
        left: `${Math.random() * 100}%`,
        animationDuration: `${1.8 + Math.random() * 1.8}s`,
        animationDelay: `${Math.random() * 0.7}s`,
        fontSize: `${14 + Math.random() * 16}px`,
      })),
    [count, pieces]
  );
  return (
    <div className="confetti" aria-hidden="true">
      {items.map(({ key, char, ...style }) => (
        <span key={key} style={style}>
          {char}
        </span>
      ))}
    </div>
  );
}
