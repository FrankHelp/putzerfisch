import { useState, useEffect, useRef } from 'react';
import { api, timeAgo } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Avatar } from './ui.jsx';

const ALL_REACTIONS = ['🫧', '🔥', '👏', '🐠', '🤩', '🧽', '💪', '😱'];

export default function FeedCard({ item, index = 0, onDeleted }) {
  const { user, toast } = useApp();
  const [reactions, setReactions] = useState(item.reactions);
  const [mine, setMine] = useState(item.myReactions);
  const [picker, setPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [popping, setPopping] = useState(null);

  const react = async (emoji) => {
    if (!user) return toast('Log dich ein, um zu reagieren.', 'err');
    setPopping(emoji);
    setTimeout(() => setPopping(null), 420);

    // Optimistisch umschalten, damit sich der Tap sofort anfühlt.
    const had = mine.includes(emoji);
    setMine((m) => (had ? m.filter((e) => e !== emoji) : [...m, emoji]));
    setReactions((rs) => {
      const found = rs.find((r) => r.emoji === emoji);
      if (found)
        return rs
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count + (had ? -1 : 1) } : r))
          .filter((r) => r.count > 0);
      return had ? rs : [...rs, { emoji, count: 1 }];
    });

    try {
      const d = await api.post(`/feed/${item.id}/react`, { emoji });
      setReactions(d.reactions);
      setMine(d.myReactions);
    } catch (e) {
      toast(e.message, 'err');
    }
    setPicker(false);
  };

  const remove = async () => {
    if (!confirm('Diesen Eintrag wirklich zurücknehmen? Die Punkte werden abgezogen.')) return;
    try {
      await api.del(`/activities/log/${item.id}`);
      toast('Eintrag zurückgenommen.');
      onDeleted?.(item.id);
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  return (
    <article className="post" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <header className="post-head">
        <Avatar
          fish={item.user.fish}
          color={item.user.color}
          level={item.user.level}
          size={42}
          onClick={() => navigate(`/user/${item.user.id}`)}
        />
        <div className="who">
          <div className="name">
            <span
              onClick={() => navigate(`/user/${item.user.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {item.user.displayName}
            </span>
          </div>
          <div className="meta">
            <span>{item.user.rankName}</span>
            <span>·</span>
            <span>{timeAgo(item.createdAt)}</span>
            {item.wg && (
              <>
                <span>·</span>
                <span>
                  {item.wg.emblem} {item.wg.name}
                </span>
              </>
            )}
          </div>
        </div>
        {item.canDelete && (
          <button className="foot-btn" onClick={remove} title="Zurücknehmen" aria-label="Zurücknehmen">
            ↩︎
          </button>
        )}
      </header>

      <div className="post-body">
        <span className="act-icon">{item.icon}</span>
        <div className="grow">
          <div className="act-name">{item.activityName}</div>
          <div className="act-sub">
            {item.minutes} Min. · Basis {item.basePoints} P
          </div>
        </div>
        <span className="points-badge">+{item.points}</span>
      </div>

      {item.bonuses?.length > 0 && (
        <div className="bonus-row">
          {item.bonuses.map((b, i) => (
            <span key={i} className="bonus-tag">
              {b.icon} {b.label} {b.value}
            </span>
          ))}
        </div>
      )}

      {item.note && <div className="note">„{item.note}“</div>}

      <div className="reactions">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            className={`reaction ${mine.includes(r.emoji) ? 'mine' : ''} ${popping === r.emoji ? 'pop' : ''}`}
            onClick={() => react(r.emoji)}
          >
            <span>{r.emoji}</span>
            <span className="n">{r.count}</span>
          </button>
        ))}
        <button className="add-reaction" onClick={() => setPicker((p) => !p)} aria-label="Reaktion hinzufügen">
          {picker ? '×' : '☺'}
        </button>
      </div>

      {picker && (
        <div className="emoji-picker">
          {ALL_REACTIONS.map((e) => (
            <button key={e} onClick={() => react(e)}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="post-foot">
        <button
          className={`foot-btn ${showComments ? 'on' : ''}`}
          onClick={() => setShowComments((s) => !s)}
        >
          💬 {commentCount > 0 ? `${commentCount} Kommentare` : 'Kommentieren'}
        </button>
        <span className="grow" />
        <span className="foot-btn" style={{ pointerEvents: 'none' }}>
          {reactions.reduce((s, r) => s + r.count, 0)} Reaktionen
        </span>
      </div>

      {showComments && <Comments logId={item.id} onCountChange={setCommentCount} />}
    </article>
  );
}

/* ---------------- Kommentarbereich ---------------- */
function Comments({ logId, onCountChange }) {
  const { user, toast } = useApp();
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    api
      .get(`/feed/${logId}/comments`)
      .then((d) => setList(d.comments))
      .catch((e) => toast(e.message, 'err'));
  }, [logId, toast]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    if (!user) return toast('Log dich ein, um zu kommentieren.', 'err');
    setSending(true);
    try {
      const d = await api.post(`/feed/${logId}/comments`, { text: value });
      setList((l) => [...(l ?? []), d.comment]);
      onCountChange?.((c) => c + 1);
      setText('');
      if (d.newBadges?.length) toast(`Neues Abzeichen: ${d.newBadges[0].icon} ${d.newBadges[0].name}`);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const vote = async (c) => {
    if (!user) return toast('Log dich ein, um abzustimmen.', 'err');
    // Optimistisch, danach mit dem Server abgleichen.
    setList((l) =>
      l.map((x) => (x.id === c.id ? { ...x, voted: !x.voted, votes: x.votes + (x.voted ? -1 : 1) } : x))
    );
    try {
      const d = await api.post(`/comments/${c.id}/vote`);
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, votes: d.votes, voted: d.voted } : x)));
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const remove = async (c) => {
    try {
      await api.del(`/comments/${c.id}`);
      setList((l) => l.filter((x) => x.id !== c.id));
      onCountChange?.((n) => n - 1);
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const sorted = list ? [...list].sort((a, b) => b.votes - a.votes || new Date(a.createdAt) - new Date(b.createdAt)) : null;

  return (
    <div className="comments">
      {sorted === null && <div className="faint center" style={{ fontSize: 13, padding: 10 }}>lädt …</div>}

      {sorted?.length === 0 && (
        <div className="faint center" style={{ fontSize: 13, padding: '8px 0 2px' }}>
          Noch still hier unten. Sag was Nettes 🫧
        </div>
      )}

      {sorted?.map((c) => (
        <div key={c.id} className="comment">
          <Avatar fish={c.user.fish} color={c.user.color} size={30} />
          <div className="bubble-c">
            <div className="c-head">
              <span className="c-name">{c.user.displayName}</span>
              <span className="c-time">{timeAgo(c.createdAt)}</span>
              {c.canDelete && (
                <button className="c-time link" onClick={() => remove(c)} style={{ marginLeft: 'auto' }}>
                  löschen
                </button>
              )}
            </div>
            <div className="c-text">{c.text}</div>
          </div>
          <button className={`vote-btn ${c.voted ? 'on' : ''}`} onClick={() => vote(c)}>
            <span className="arrow">▲</span>
            <span>{c.votes}</span>
          </button>
        </div>
      ))}

      <form className="comment-form" onSubmit={submit}>
        <input
          ref={inputRef}
          className="input grow"
          placeholder="Kommentar schreiben …"
          value={text}
          maxLength={400}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" disabled={sending || !text.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
