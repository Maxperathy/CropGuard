import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

export const historyRouter = Router();

historyRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt((req.query.limit as string) ?? '50', 10);

    const rows = await query<{
      id: string;
      user_id: string;
      image_ref: string;
      diagnosis: string;
      confidence: number;
      status: string;
      created_at: string;
    }>(
      `SELECT id, user_id, image_ref, diagnosis, confidence, status, created_at
       FROM diagnoses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ diagnoses: rows });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch diagnosis history' });
  }
});

historyRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM diagnoses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('History delete error:', err);
    res.status(500).json({ error: 'Failed to delete diagnosis' });
  }
});
