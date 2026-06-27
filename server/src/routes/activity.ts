import { Router, Request, Response } from 'express';
import {
  getUserActivity,
  completeLesson,
} from '../services/activityService';

export const activityRouter = Router();

activityRouter.post('/lesson-complete', async (req: Request, res: Response) => {
  try {
    const { userId, lessonTitle } = req.body as {
      userId?: string;
      lessonTitle?: string;
    };

    if (!userId || !lessonTitle) {
      res.status(400).json({ error: 'userId and lessonTitle are required' });
      return;
    }

    const result = await completeLesson(userId, lessonTitle);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('Lesson complete error:', err);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

activityRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const result = await getUserActivity(String(req.params.userId));
    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Activity fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});
