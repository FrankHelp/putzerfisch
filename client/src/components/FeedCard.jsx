import { useState, useEffect, useRef } from 'react';
import { api, timeAgo, plural } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import { Avatar } from './ui.jsx';
import { compressToJpegDataUrl } from '../photo.js';
import { haptic } from '../haptics.js';

const ALL_REACTIONS = ['🫧', '🔥', '👏', '🐠', '🤩', '🧽', '💪', '😱'];

export default function FeedCard({ item, index = 0, onDeleted, openComments = false }) {
  const { user, setUser, toast } = useApp();
  const [reactions, setReactions] = useState(item.reactions);
  const [mine, setMine] = useState(item.myReactions);
  const [picker, setPicker] = useState(false);
  const [showComments, setShowComments] = useState(openComments);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [popping, setPopping] = useState(null);

  const react = async (emoji) => {
    if (!user) return toast('Log dich ein, um zu reagieren.', 'err');
    haptic('success'); // sofortiges Belohnungs-Feedback (optimistisch)
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

  const reactionTotal = reactions.reduce((s, r) => s + r.count, 0);

  const remove = async () => {
    if (!confirm('Diesen Eintrag wirklich zurücknehmen? Die Punkte werden abgezogen.')) return;
    try {
      const d = await api.del(`/activities/log/${item.id}`);
      if (d.user) setUser(d.user); // Punkte/Rang sofort überall aktualisieren (HeroCard, TopBar, …)
      haptic('danger'); // Eintrag weg – Punkte werden abgezogen
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

      {item.photo && (
        <img
          className="post-photo"
          src={item.photo}
          alt={`Foto zu ${item.activityName}`}
          loading="lazy"
        />
      )}

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
          💬 {commentCount > 0 ? plural(commentCount, 'Kommentar', 'Kommentare') : 'Kommentieren'}
        </button>
        <span className="grow" />
        <span className="foot-btn" style={{ pointerEvents: 'none' }}>
          {plural(reactionTotal, 'Reaktion', 'Reaktionen')}
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
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    api
      .get(`/feed/${logId}/comments`)
      .then((d) => setList(d.comments))
      .catch((e) => toast(e.message, 'err'));
  }, [logId, toast]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // erlaubt, dieselbe Datei erneut zu wählen
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Bitte ein Bild wählen.', 'err');
    try {
      setPhoto(await compressToJpegDataUrl(file));
    } catch {
      toast('Foto konnte nicht gelesen werden.', 'err');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value && !photo) return;
    if (!user) return toast('Log dich ein, um zu kommentieren.', 'err');
    setSending(true);
    try {
      const d = await api.post(`/feed/${logId}/comments`, { text: value, photo: photo || undefined });
      haptic('success'); // Kommentar abgeschickt
      setList((l) => [...(l ?? []), d.comment]);
      onCountChange?.((c) => c + 1);
      setText('');
      setPhoto(null);
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
    haptic('success'); // Belohnung für soziale Interaktion (optimistisch)
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
            {c.text && <div className="c-text">{c.text}</div>}
            {c.photo && (
              <img className="c-photo" src={c.photo} alt="Kommentar-Foto" loading="lazy" />
            )}
          </div>
          <button className={`vote-btn ${c.voted ? 'on' : ''}`} onClick={() => vote(c)}>
            <span className="arrow">▲</span>
            <span>{c.votes}</span>
          </button>
        </div>
      ))}

      <form className="comment-form" onSubmit={submit}>
        {photo && (
          <div className="comment-photo-pre">
            <img src={photo} alt="Vorschau" />
            <button type="button" onClick={() => setPhoto(null)} aria-label="Foto entfernen">
              ×
            </button>
          </div>
        )}
        <div className="comment-form-row">
          <div className="comment-input-wrap">
            <input
              ref={inputRef}
              className="input"
              placeholder="Kommentar schreiben …"
              value={text}
              maxLength={400}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="button"
              className="attach-btn"
              onClick={() => photoInputRef.current?.click()}
              title="Foto anhängen"
              aria-label="Foto anhängen"
            >
              <AttachIcon size={17} />
            </button>
          </div>
          <button className="btn btn-primary btn-sm" disabled={sending || (!text.trim() && !photo)}>
            ➤
          </button>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
      </form>
    </div>
  );
}

/* ---------------- Anhängen-Icon (attach-svgrepo-com.svg) ---------------- */
function AttachIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 8.00092L7 17C7 17.5523 6.55228 18 6 18C5.44772 18 5.00001 17.4897 5 16.9374C5 16.9374 5 16.9374 5 16.9374C5 16.937 5.00029 8.01023 5.00032 8.00092C5.00031 7.96702 5.00089 7.93318 5.00202 7.89931C5.00388 7.84357 5.00744 7.76644 5.01426 7.67094C5.02788 7.4803 5.05463 7.21447 5.10736 6.8981C5.21202 6.27011 5.42321 5.41749 5.85557 4.55278C6.28989 3.68415 6.95706 2.78511 7.97655 2.10545C9.00229 1.42162 10.325 1 12 1C13.6953 1 14.9977 1.42162 16.0235 2.10545C17.0429 2.78511 17.7101 3.68415 18.1444 4.55278C18.5768 5.41749 18.788 6.27011 18.8926 6.8981C18.9454 7.21447 18.9721 7.4803 18.9857 7.67094C18.9926 7.76644 18.9961 7.84357 18.998 7.89931C18.9991 7.93286 18.9997 7.96641 19 7.99998C19.0144 10.7689 19.0003 17.7181 19 18.001C19 18.0268 18.9993 18.0525 18.9985 18.0782C18.9971 18.1193 18.9945 18.175 18.9896 18.2431C18.9799 18.3791 18.961 18.5668 18.9239 18.7894C18.8505 19.2299 18.7018 19.8325 18.3944 20.4472C18.0851 21.0658 17.6054 21.7149 16.8672 22.207C16.1227 22.7034 15.175 23 14 23C12.825 23 11.8773 22.7034 11.1328 22.207C10.3946 21.7149 9.91489 21.0658 9.60557 20.4472C9.29822 19.8325 9.14952 19.2299 9.07611 18.7894C9.039 18.5668 9.02007 18.3791 9.01035 18.2431C9.00549 18.175 9.0029 18.1193 9.00153 18.0782C9.00069 18.0529 9.00008 18.0275 9 18.0022C8.99621 15.0044 9 12.0067 9 9.00902C9.00101 8.95723 9.00276 8.89451 9.00645 8.84282C9.01225 8.76155 9.02338 8.65197 9.04486 8.5231C9.08702 8.27011 9.17322 7.91749 9.35558 7.55278C9.53989 7.18415 9.83207 6.78511 10.2891 6.48045C10.7523 6.17162 11.325 6 12 6C12.675 6 13.2477 6.17162 13.7109 6.48045C14.1679 6.78511 14.4601 7.18415 14.6444 7.55278C14.8268 7.91749 14.913 8.27011 14.9551 8.5231C14.9766 8.65197 14.9877 8.76155 14.9936 8.84282C14.9984 8.91124 14.9999 8.95358 15 8.99794L15 17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V9.00902C12.9995 8.99543 12.9962 8.93484 12.9824 8.8519C12.962 8.72989 12.9232 8.58251 12.8556 8.44722C12.7899 8.31585 12.7071 8.21489 12.6015 8.14455C12.5023 8.07838 12.325 8 12 8C11.675 8 11.4977 8.07838 11.3985 8.14455C11.2929 8.21489 11.2101 8.31585 11.1444 8.44722C11.0768 8.58251 11.038 8.72989 11.0176 8.8519C11.0038 8.93484 11.0005 8.99543 11 9.00902V17.9957C11.0009 18.0307 11.0028 18.0657 11.0053 18.1006C11.0112 18.1834 11.0235 18.3082 11.0489 18.4606C11.1005 18.7701 11.2018 19.1675 11.3944 19.5528C11.5851 19.9342 11.8554 20.2851 12.2422 20.543C12.6227 20.7966 13.175 21 14 21C14.825 21 15.3773 20.7966 15.7578 20.543C16.1446 20.2851 16.4149 19.9342 16.6056 19.5528C16.7982 19.1675 16.8995 18.7701 16.9511 18.4606C16.9765 18.3082 16.9888 18.1834 16.9947 18.1006C16.9972 18.0657 16.9991 18.0307 17 17.9956L16.9999 7.99892C16.9997 7.98148 16.9982 7.91625 16.9908 7.81343C16.981 7.67595 16.9609 7.47303 16.9199 7.2269C16.837 6.72989 16.6732 6.08251 16.3556 5.44722C16.0399 4.81585 15.5821 4.21489 14.9141 3.76955C14.2523 3.32838 13.325 3 12 3C10.675 3 9.7477 3.32838 9.08595 3.76955C8.41793 4.21489 7.96011 4.81585 7.64443 5.44722C7.32678 6.08251 7.16298 6.72989 7.08014 7.2269C7.03912 7.47303 7.019 7.67595 7.00918 7.81343C7.0025 7.90687 7.00117 7.9571 7 8.00092Z"
      />
    </svg>
  );
}
