import { useEffect, useState } from 'react';
import { Confetti, CountUp } from './ui.jsx';

/* ---------- Serien-Feier (wie bei Duolingo) ---------- */
export function StreakCelebration({ streak, bestStreak, onDone }) {
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="splash">
      {showConfetti && <Confetti pieces={['🔥', '✨', '💧', '🐠', '⭐']} count={20} />}
      <div>
        <div className="ring streak-ring">🔥</div>
        <div className="streak-days">
          <span className="streak-num">
            <CountUp to={streak} />
          </span>{' '}
          Tage Serie!
        </div>
        <div className="headline">Serie verlängert</div>
        <div className="sub" style={{ marginTop: 3 }}>
          Stark, dass du dranbleibst – morgen geht's weiter. 🔥
        </div>
        {bestStreak > streak && <div className="streak-best">Rekord: {bestStreak} Tage</div>}
        <div className="mt-lg">
          <button className="btn btn-primary" onClick={onDone}>
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Level-Up-Feier ---------- */
export function LevelUpCelebration({ rank, onDone }) {
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="splash">
      {showConfetti && <Confetti pieces={['🎉', '✨', '🏆', '⭐', '🫧', '🐠']} />}
      <div>
        <div className="ring lu-ring">{rank.fish}</div>
        <div className="lu-level">Level {rank.level}</div>
        <div className="lu-title-big">Level Up!</div>
        <div className="lu-name-big">{rank.name}</div>
        <div className="sub" style={{ marginTop: 6 }}>{rank.blurb}</div>

        {rank.nextXp != null && (
          <div className="rank-progress" style={{ marginTop: 18 }}>
            <div className="between" style={{ fontSize: 13, fontWeight: 800 }}>
              <span className="muted">Nächstes Level: {rank.nextName}</span>
              <span style={{ color: 'var(--gold)' }}>{rank.toNext} XP</span>
            </div>
            <div className="rank-bar">
              <i style={{ width: `${Math.round(rank.progress * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="mt-lg">
          <button className="btn btn-primary" onClick={onDone}>
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}
