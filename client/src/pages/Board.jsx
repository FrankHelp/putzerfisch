import { useEffect, useState } from 'react';
import { api, num } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Avatar, Empty, Skeletons } from '../components/ui.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANGES = [
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'all', label: 'Ewig' },
];

export default function Board() {
  const { user, toast } = useApp();
  const [tab, setTab] = useState(user?.wg ? 'wg' : 'global');
  const [range, setRange] = useState('week');
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    // Ohne WG hat die interne Rangliste nichts zu holen – gar nicht erst fragen.
    if (tab === 'wg' && !user?.wg) {
      setData({ entries: [], wg: null });
      return;
    }
    const url =
      tab === 'wg'
        ? `/leaderboard/wg?range=${range}`
        : tab === 'liga'
          ? `/leaderboard/wgs?range=${range}`
          : `/leaderboard/global?range=${range}`;
    api
      .get(url)
      .then(setData)
      .catch((e) => {
        toast(e.message, 'err');
        setData({ entries: [] });
      });
  }, [tab, range, toast, user?.wg]);

  return (
    <div className="screen">
      <h1 className="screen-title">Rangliste</h1>
      <p className="screen-sub">Wer schrubbt sich an die Spitze?</p>

      <div className="segmented">
        <button className={tab === 'wg' ? 'on' : ''} onClick={() => setTab('wg')}>
          🪸 WG
        </button>
        <button className={tab === 'liga' ? 'on' : ''} onClick={() => setTab('liga')}>
          🏆 WG-Liga
        </button>
        <button className={tab === 'global' ? 'on' : ''} onClick={() => setTab('global')}>
          🌍 Global
        </button>
      </div>

      <div className="chips">
        {RANGES.map((r) => (
          <button key={r.id} className={`chip ${range === r.id ? 'on' : ''}`} onClick={() => setRange(r.id)}>
            {r.label}
          </button>
        ))}
      </div>

      {data === null && <Skeletons n={6} height={62} />}

      {data && tab === 'wg' && <WgBoard data={data} hasWg={!!user?.wg} />}
      {data && tab === 'liga' && <LigaBoard data={data} />}
      {data && tab === 'global' && <GlobalBoard data={data} />}
    </div>
  );
}

/* ---------- Podest für die Top 3 ---------- */
function Podium({ entries }) {
  if (entries.length < 3) return null;
  const [first, second, third] = entries;
  // Optisch: Silber links, Gold erhöht in der Mitte, Bronze rechts.
  const slots = [
    { entry: second, medal: '🥈' },
    { entry: first, medal: '🥇' },
    { entry: third, medal: '🥉' },
  ];
  return (
    <div className="podium">
      {slots.map(({ entry, medal }) => (
        <div className="slot" key={entry.id}>
          <Avatar
            fish={entry.fish}
            color={entry.color}
            size={medal === '🥇' ? 50 : 40}
            onClick={() => navigate(`/user/${entry.id}`)}
          />
          <div className="pname">{entry.displayName}</div>
          <div className="stand">
            {medal}
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800 }}>{num(entry.points)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Interne WG-Rangliste ---------- */
function WgBoard({ data, hasWg }) {
  if (!hasWg || !data.wg)
    return (
      <Empty emoji="🪸" title="Noch kein Riff" text="Tritt einer WG bei, um euch intern zu messen.">
        <button className="btn btn-primary" onClick={() => navigate('/wg')}>
          WG beitreten oder gründen
        </button>
      </Empty>
    );

  const reef = data.reef;
  return (
    <>
      <div className="card card-hero">
        <div className="between">
          <div className="row">
            <span style={{ fontSize: 28 }}>{data.wg.emblem}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{data.wg.name}</div>
              {data.wg.motto && (
                <div className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>„{data.wg.motto}“</div>
              )}
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => navigate('/wg')}>
            Details
          </button>
        </div>

        <div className="reef-meter">
          <div className="reef-head">
            <span>
              {reef.state.icon} Riff-Sauberkeit: <span style={{ color: reef.state.color }}>{reef.state.label}</span>
            </span>
            <span className="muted">{reef.score}%</span>
          </div>
          <div className="reef-bar">
            <i style={{ width: `${reef.score}%`, background: `linear-gradient(90deg, ${reef.state.color}, ${reef.state.color}aa)` }} />
          </div>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>
            Basiert auf den letzten 7 Tagen · {reef.members} Bewohner
          </div>
        </div>
      </div>

      <div className="section-title">Fairer Anteil: {num(data.fairShare)} Punkte pro Person</div>

      {data.entries.map((e, i) => (
        <div key={e.id} className={`lb-row ${e.isMe ? 'me' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
          <span className={`lb-rank ${i < 3 ? 'medal' : ''}`}>{MEDALS[i] ?? i + 1}</span>
          <Avatar fish={e.fish} color={e.color} size={38} level={e.level} onClick={() => navigate(`/user/${e.id}`)} />
          <div className="lb-main">
            <div className="lb-name">
              {e.displayName} {e.streak > 2 && <span title={`${e.streak} Tage Serie`}>🔥{e.streak}</span>}
            </div>
            <div className="lb-sub">
              {e.share}% der WG-Leistung
              {e.points >= data.fairShare && data.fairShare > 0 ? ' · trägt mit ✅' : ''}
            </div>
          </div>
          <div className="lb-points">
            {num(e.points)}
            <small>Punkte</small>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- WG-Liga (gemittelt) ---------- */
function LigaBoard({ data }) {
  if (!data.entries.length)
    return <Empty emoji="🏆" title="Noch keine WGs" text="Gründe die erste und setz den Maßstab." />;

  return (
    <>
      <div className="card card-tight" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>
          ⚖️ Gewertet werden <b style={{ color: 'var(--text)' }}>Punkte pro Kopf</b> — so hat eine 2er-WG die
          gleiche Chance wie eine 8er-WG.
        </div>
      </div>

      {data.entries.map((w, i) => (
        <div key={w.id} className={`lb-row ${w.isMine ? 'me' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
          <span className={`lb-rank ${i < 3 ? 'medal' : ''}`}>{MEDALS[i] ?? i + 1}</span>
          <span style={{ fontSize: 26, flex: 'none' }}>{w.emblem}</span>
          <div className="lb-main">
            <div className="lb-name">{w.name}</div>
            <div className="lb-sub">
              {w.members} Bewohner · gesamt {num(w.total)}
              {w.reef?.state && ` · ${w.reef.state.icon} ${w.reef.state.label}`}
            </div>
          </div>
          <div className="lb-points">
            {num(w.average)}
            <small>ø / Kopf</small>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- Globale Einzelwertung ---------- */
function GlobalBoard({ data }) {
  if (!data.entries.length) return <Empty emoji="🌍" title="Der Ozean ist noch leer" />;

  // Das Podest lohnt sich erst ab drei Fischen; darunter reicht die Liste.
  const hasPodium = data.entries.length >= 3;
  const listed = hasPodium ? data.entries.slice(3) : data.entries;

  return (
    <>
      {hasPodium && <Podium entries={data.entries.slice(0, 3)} />}

      {listed.map((e, i) => (
        <div key={e.id} className={`lb-row ${e.isMe ? 'me' : ''}`} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
          <span className={`lb-rank ${!hasPodium && e.rank <= 3 ? 'medal' : ''}`}>
            {!hasPodium && e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}
          </span>
          <Avatar fish={e.fish} color={e.color} size={38} level={e.level} onClick={() => navigate(`/user/${e.id}`)} />
          <div className="lb-main">
            <div className="lb-name">
              {e.displayName} {e.streak > 2 && <span>🔥{e.streak}</span>}
            </div>
            <div className="lb-sub">
              {e.rankName}
              {e.wg ? ` · ${e.wg.emblem} ${e.wg.name}` : ' · Einzelkämpfer'}
            </div>
          </div>
          <div className="lb-points">
            {num(e.points)}
            <small>Punkte</small>
          </div>
        </div>
      ))}

      {data.me && data.me.rank > 12 && (
        <div className="card card-tight mt" style={{ position: 'sticky', bottom: 10 }}>
          <div className="row">
            <span className="lb-rank">{data.me.rank}</span>
            <span className="grow" style={{ fontWeight: 800, fontSize: 14 }}>Dein Platz</span>
            <span style={{ fontWeight: 900, color: 'var(--sand)' }}>{num(data.me.points)}</span>
          </div>
        </div>
      )}
    </>
  );
}
