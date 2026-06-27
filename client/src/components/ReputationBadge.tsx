import { useEffect, useState } from 'react';
import { getActivity, completeLesson, Activity, User } from '../services/api';

interface Props {
  userId: string;
  refreshKey: number;
}

export function ReputationBadge({ userId, refreshKey }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);

  async function loadActivity() {
    try {
      const data = await getActivity(userId);
      setUser(data.user);
      setActivities(data.activities);
    } catch {
      setUser(null);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [userId, refreshKey]);

  async function handleLessonComplete() {
    setLessonLoading(true);
    try {
      await completeLesson(userId, 'Crop Rotation Basics');
      await loadActivity();
    } finally {
      setLessonLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="panel panel-reputation">
        <h2>⭐ Reputation</h2>
        <p className="hint">Loading...</p>
      </section>
    );
  }

  return (
    <section className="panel panel-reputation">
      <h2>⭐ Reputation</h2>
      {user && (
        <>
          <p className="reputation-name">{user.display_name}</p>
          <p className="reputation-score">{user.reputation_score} pts</p>
        </>
      )}

      <button
        type="button"
        className="btn btn-sm"
        onClick={handleLessonComplete}
        disabled={lessonLoading}
      >
        {lessonLoading ? 'Saving...' : 'Complete demo lesson (+15 pts)'}
      </button>

      <ul className="activity-list">
        {activities.slice(0, 8).map((a) => (
          <li key={a.id}>
            <span className="activity-points">+{a.points}</span>
            <span>{a.description ?? a.type}</span>
          </li>
        ))}
        {activities.length === 0 && <li className="hint">No activity yet.</li>}
      </ul>
    </section>
  );
}
