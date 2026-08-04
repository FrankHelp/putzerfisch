import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../state.jsx';
import { navigate } from '../router.jsx';
import FeedCard from '../components/FeedCard.jsx';
import { Empty, Skeletons } from '../components/ui.jsx';

/** Einzelne Putzaktion – Ziel eines Riffpost-Taps. */
export default function LogDetail({ logId }) {
  const { toast } = useApp();
  const [item, setItem] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setItem(null);
    setMissing(false);
    api
      .get(`/feed/${logId}`)
      .then((d) => alive && setItem(d.item))
      .catch((e) => {
        if (!alive) return;
        setMissing(true);
        if (e.status !== 404) toast(e.message, 'err');
      });
    return () => {
      alive = false;
    };
  }, [logId, toast]);

  return (
    <div className="screen">
      <button className="back-link" onClick={() => navigate('/feed')}>
        ← Zurück zum Riff
      </button>

      {!item && !missing && <Skeletons n={1} height={220} />}

      {missing && (
        <Empty
          emoji="🪸"
          title="Weggeschwommen"
          text="Diese Putzaktion gibt es nicht mehr."
        >
          <button className="btn btn-primary" onClick={() => navigate('/feed')}>
            Zum Feed
          </button>
        </Empty>
      )}

      {item && <FeedCard item={item} openComments onDeleted={() => navigate('/feed')} />}
    </div>
  );
}
