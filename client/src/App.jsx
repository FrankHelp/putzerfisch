import { useEffect, useState, useCallback } from 'react';
import { useApp } from './state.jsx';
import { useRoute, navigate } from './router.jsx';
import { setPlanMode } from './plan.js';
import { Ocean, Toasts, Sheet, Avatar } from './components/ui.jsx';
import { initSoundSystem, startMusic, getSoundEnabled, setSoundEnabled } from './sound.js';
import { initHapticSystem } from './haptics.js';
import { isStandalone, pushState, enablePush, disablePush, installAvailable, installApp } from './push.js';
import Inbox from './components/Inbox.jsx';
import Login from './pages/Login.jsx';
import LogDetail from './pages/LogDetail.jsx';
import Feed from './pages/Feed.jsx';
import Add from './pages/Add.jsx';
import Plan from './pages/Plan.jsx';
import Board from './pages/Board.jsx';
import Ideas from './pages/Ideas.jsx';
import Profile from './pages/Profile.jsx';
import WG from './pages/WG.jsx';

const TABS = [
  { id: 'feed', icon: '🌊', label: 'Feed' },
  { id: 'board', icon: '🏆', label: 'Rangliste' },
  { id: 'plan', icon: '📋', label: 'Putzplan' },
  { id: 'me', icon: '🐠', label: 'Ich' },
];

export default function App() {
  const { user, booting } = useApp();
  const { view, param } = useRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());

  useEffect(() => {
    initSoundSystem();
    initHapticSystem();
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
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundOn={soundOn}
        onToggleSound={onToggleSound}
      />
    </>
  );
}

function Screen({ view, param }) {
  switch (view) {
    case 'add':
      return <Add />;
    case 'plan':
      return <Plan />;
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
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">🐠</span>
        <span>Putzerfisch</span>
      </div>
      <div className="spacer" />
      <Inbox />
      {user.streak > 0 && (
        <div className="streak-chip" title="Tage in Folge geputzt">
          🔥 {user.streak}
        </div>
      )}
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

/* ---------- Push-Benachrichtigungen (Riffpost ans Handy) ---------- */
// iOS zeigt den Push-Prompt nur in der installierten App – der Hinweis soll
// genau dann erscheinen. Android (Chrome) kann Push auch ohne Installation.
const isIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function PushSetting() {
  const { toast } = useApp();
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState(false);
  const standalone = isStandalone();

  const refresh = useCallback(async () => {
    try {
      setState(await pushState());
    } catch {
      setState('unsupported');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (state === 'on') {
        await disablePush();
        setState('off');
      } else {
        await enablePush();
        toast('🔔 Riffpost kommt jetzt auch im Hintergrund an.');
        setState('on');
      }
    } catch (e) {
      toast(e.message, 'err');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const on = state === 'on';
  const hints = {
    unsupported: 'Dieses Gerät kann keine Push-Benachrichtigungen.',
    denied: 'In den System-Einstellungen unter „Putzerfisch“ → Benachrichtigungen erlauben.',
    off: standalone
      ? 'Tippen, um Riffpost auch im Hintergrund zu bekommen.'
      : isIOS
        ? 'Auf dem iPhone erst zum Homescreen hinzufügen (Teilen → Zum Home-Bildschirm), dann hier aktivieren.'
        : 'Tippen, um Riffpost auch im Hintergrund zu bekommen.',
  };

  return (
    <div className="row" style={{ marginTop: 14, alignItems: 'center' }}>
      <div className="grow">
        <div style={{ fontWeight: 800, fontSize: 15 }}>🔔 Benachrichtigungen</div>
        <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>
          {state === 'loading' ? '…' : on ? 'Riffpost-Push ist an' : (hints[state] ?? '')}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Push-Benachrichtigungen an/aus"
        className={`switch ${on ? 'on' : ''}`}
        disabled={busy || state === 'loading' || state === 'unsupported' || state === 'denied'}
        onClick={toggle}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

/* ---------- App installieren (Android/Chrome; iOS nutzt das Share-Menü) ---------- */
function InstallRow() {
  const { toast } = useApp();
  const [available, setAvailable] = useState(installAvailable());

  useEffect(() => {
    const onChange = () => setAvailable(installAvailable());
    window.addEventListener('appinstalled', onChange);
    return () => window.removeEventListener('appinstalled', onChange);
  }, []);

  if (!available) return null;
  return (
    <div className="row" style={{ marginTop: 14, alignItems: 'center' }}>
      <div className="grow">
        <div style={{ fontWeight: 800, fontSize: 15 }}>📲 App installieren</div>
        <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>
          Als App auf den Homescreen – mit eigenem Icon & Push-Badge
        </div>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={async () => {
          try {
            await installApp();
            toast('📲 Putzerfisch wird installiert.');
          } catch (e) {
            toast(e.message, 'err');
          }
        }}
      >
        Installieren
      </button>
    </div>
  );
}

/* ---------- Settings-Modal (Sound + Push) ---------- */
function SettingsSheet({ open, onClose, soundOn, onToggleSound }) {
  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen">
      <InstallRow />
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
      <PushSetting />
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
        {/* Der Schwamm ist der schnelle „jetzt putzen“-Einstieg: Plan-Modus aus,
            damit ein Tipp nicht versehentlich den Plan befüllt. Planen geht über
            den Putzplan-Reiter unten oder den 📋-Toggle in der Auswahl. */}
        <button
          className="fab"
          onClick={() => {
            setPlanMode(false);
            navigate('/add');
          }}
          aria-label="Putzaktivität eintragen"
        >
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
