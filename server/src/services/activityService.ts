import { query, queryOne } from '../db/pool';

const LESSON_POINTS = 15;

export interface UserRow {
  id: string;
  display_name: string;
  reputation_score: number;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export async function createUser(displayName: string): Promise<UserRow> {
  const user = await queryOne<UserRow>(
    `INSERT INTO users (display_name) VALUES ($1) RETURNING *`,
    [displayName]
  );
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function getUserActivity(userId: string): Promise<{
  user: UserRow;
  activities: ActivityRow[];
} | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const activities = await query<ActivityRow>(
    `SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );

  return { user, activities };
}

export async function completeLesson(
  userId: string,
  lessonTitle: string
): Promise<{ user: UserRow; activity: ActivityRow }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  const activity = await queryOne<ActivityRow>(
    `INSERT INTO activities (user_id, type, points, description)
     VALUES ($1, 'lesson_completed', $2, $3)
     RETURNING *`,
    [userId, LESSON_POINTS, `Completed lesson: ${lessonTitle}`]
  );

  if (!activity) throw new Error('Failed to record activity');

  const updatedUser = await queryOne<UserRow>(
    `UPDATE users SET reputation_score = reputation_score + $1 WHERE id = $2 RETURNING *`,
    [LESSON_POINTS, userId]
  );

  if (!updatedUser) throw new Error('Failed to update reputation');

  return { user: updatedUser, activity };
}
