import { Router, Request, Response } from 'express';
import multer from 'multer';
import { runDiagnosisPipeline, SnwolleyApiError } from '../services/diagnosisService';
import { continueChatWithAgent } from '../services/agentsClient';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const diagnoseRouter = Router();

function handleSnwolleyError(res: Response, err: SnwolleyApiError): void {
  const status = err.status === 401 ? 401 : 502;
  res.status(status).json({ error: `Snwolley API issue: ${err.message}` });
}

diagnoseRouter.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const contentType = req.headers['content-type'] ?? '';

    if (contentType.includes('multipart/form-data')) {
      const userId = req.body.userId as string | undefined;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'image file is required' });
        return;
      }

      const result = await runDiagnosisPipeline({
        userId,
        imageBuffer: req.file.buffer,
        filename: req.file.originalname,
      });
      res.json(result);
      return;
    }

    const { userId, imageUrl } = req.body as { userId?: string; imageUrl?: string };
    if (!userId || !imageUrl) {
      res.status(400).json({ error: 'userId and imageUrl are required' });
      return;
    }

    const result = await runDiagnosisPipeline({ userId, imageUrl });
    res.json(result);
  } catch (err) {
    if (err instanceof SnwolleyApiError) {
      handleSnwolleyError(res, err);
      return;
    }
    if (err instanceof Error) {
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      if (err.message === 'NO_IMAGE_PROVIDED') {
        res.status(400).json({ error: 'No image provided' });
        return;
      }
    }
    console.error('Diagnose error:', err);
    res.status(500).json({ error: 'Internal server error during diagnosis' });
  }
});

diagnoseRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, chatId, message, chatHistory } = req.body as {
      userId?: string;
      chatId?: string | null;
      message?: string;
      chatHistory?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!userId || !message || !chatHistory) {
      res.status(400).json({ error: 'userId, message, and chatHistory are required' });
      return;
    }

    const chatResult = await continueChatWithAgent(message, chatHistory, chatId);

    const audioBase64: string | null = null;
    const audioFormat: 'mp3' | 'wav' | null = null;

    res.json({
      reply: chatResult.reply,
      chatId: chatResult.chatId,
      audio_base64: audioBase64,
      audio_format: audioFormat,
    });
  } catch (err) {
    if (err instanceof SnwolleyApiError) {
      handleSnwolleyError(res, err);
      return;
    }
    console.error('Chat follow-up error:', err);
    res.status(500).json({ error: 'Failed to process follow-up question' });
  }
});
