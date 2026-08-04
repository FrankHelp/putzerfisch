import { useApp } from './state.jsx';
import { useRoute, navigate } from './router.jsx';
import { Ocean, Toasts, Avatar } from './components/ui.jsx';
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
        <TopBar user={user} />
        <Screen view={view} param={param} />
      </div>
      <TabBar view={view} />
      <Toasts />
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

function TopBar({ user }) {
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
      <Avatar
        fish={user.fish}
        color={user.color}
        size={36}
        level={user.rank.level}
        onClick={() => navigate('/me')}
      />
    </header>
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
