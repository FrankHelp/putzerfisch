import { useEffect, useState } from 'react';
import { useApp } from './state.jsx';
import { useRoute, navigate } from './router.jsx';
import { Ocean, Toasts, Sheet, Avatar } from './components/ui.jsx';
import { initSoundSystem, startMusic, getSoundEnabled, setSoundEnabled } from './sound.js';
import Inbox from './components/Inbox.jsx';
import Login from './pages/Login.jsx';
import LogDetail from './pages/LogDetail.jsx';
import Feed from './pages/Feed.jsx';
import Add from './pages/Add.jsx';
import Board from './pages/Board.jsx';
import Ideas from './pages/Ideas.jsx';
import Profile from './pages/Profile.jsx';
import WG from './pages/WG.jsx';

const TABS = [
  { id: 'feed', icon: '🌊', label: 'Feed' },
  { id: 'board', icon: '🏆', label: 'Rangliste' },
  { id: 'ideas', icon: '💡', label: 'Ideen' },
  { id: 'me', icon: '🐠', label: 'Ich' },
];

export default function App() {
  const { user, booting } = useApp();
  const { view, param } = useRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());

  useEffect(() => {
    initSoundSystem();
    startMusic();
  }, []);

  const onToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  if (booting)
    return (
      <>
        <Ocean />
        <div className="app">
          <div className="screen" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
            <div className="center">
              <div style={{ fontSize: 56, animation: 'swim 2s ease-in-out infinite' }}>🐠</div>
              <div className="muted" style={{ fontWeight: 800, marginTop: 8 }}>taucht auf …</div>
            </div>
          </div>
        </div>
      </>
    );

  if (!user)
    return (
      <>
        <Ocean />
        <div className="app">
          <Login />
        </div>
        <Toasts />
      </>
    );

  return (
    <>
      <Ocean />
      <div className="app">
        <TopBar user={user} view={view} onOpenSettings={() => setSettingsOpen(true)} />
        <Screen view={view} param={param} />
      </div>
      <TabBar view={view} />
      <Toasts />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} soundOn={soundOn} onToggleSound={onToggleSound} />
    </>
  );
}

function Screen({ view, param }) {
  switch (view) {
    case 'add':
      return <Add />;
    case 'board':
      return <Board />;
    case 'ideas':
      return <Ideas />;
    case 'me':
      return <Profile />;
    case 'user':
      return <Profile userId={Number(param)} />;
    case 'wg':
      return <WG />;
    case 'log':
      return <LogDetail logId={Number(param)} />;
    case 'feed':
    default:
      return <Feed />;
  }
}

function TopBar({ user, view, onOpenSettings }) {
  const hot = user.streak > 0;
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">🐠</span>
        <span>Putzerfisch</span>
      </div>
      <div className="spacer" />
      <Inbox />
      <div className={`streak-chip ${hot ? '' : 'cold'}`} title="Tage in Folge geputzt">
        {hot ? '🔥' : '🧊'} {user.streak}
      </div>
      {view === 'me' ? (
        <button className="settings-btn" onClick={onOpenSettings} aria-label="Einstellungen" title="Einstellungen">
          <SettingsIcon />
        </button>
      ) : (
        <Avatar
          fish={user.fish}
          color={user.color}
          size={36}
          level={user.rank.level}
          onClick={() => navigate('/me')}
        />
      )}
    </header>
  );
}

/* ---------- Einstellungsrad (Feather-Icon, MIT-Lizenz, currentColor = Theme) ---------- */
function SettingsIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ---------- Settings-Modal (aktuell nur Sound) ---------- */
function SettingsSheet({ open, onClose, soundOn, onToggleSound }) {
  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen">
      <div className="row" style={{ marginTop: 14, alignItems: 'center' }}>
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 15 }}>🔊 Sound</div>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>
            {soundOn ? 'Musik & Klick-Sounds an' : 'Musik & Klick-Sounds aus'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={soundOn}
          aria-label="Sound an/aus"
          className={`switch ${soundOn ? 'on' : ''}`}
          onClick={onToggleSound}
        >
          <span className="knob" />
        </button>
      </div>
    </Sheet>
  );
}

function TabBar({ view }) {
  const isOn = (id) => view === id || (id === 'me' && view === 'user') || (id === 'board' && view === 'wg');
  return (
    <nav className="tabbar">
      {TABS.slice(0, 2).map((t) => (
        <button key={t.id} className={`tab ${isOn(t.id) ? 'on' : ''}`} onClick={() => navigate(`/${t.id}`)}>
          <span className="ic">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}

      <div className="fab-slot">
        <button className="fab" onClick={() => navigate('/add')} aria-label="Putzaktivität eintragen">
          🧽
        </button>
      </div>

      {TABS.slice(2).map((t) => (
        <button key={t.id} className={`tab ${isOn(t.id) ? 'on' : ''}`} onClick={() => navigate(`/${t.id}`)}>
          <span className="ic">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
