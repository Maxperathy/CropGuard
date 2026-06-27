import { Router, Request, Response } from 'express';
import { createUser, getUserById } from '../services/activityService';

export const usersRouter = Router();

usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { displayName } = req.body as { displayName?: string };
    if (!displayName || !displayName.trim()) {
      res.status(400).json({ error: 'displayName is required' });
      return;
    }

    const user = await createUser(displayName.trim());
    res.status(201).json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(String(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
