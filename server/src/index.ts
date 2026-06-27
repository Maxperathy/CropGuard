import './config/env';
import express from 'express';
import cors from 'cors';
import { diagnoseRouter } from './routes/diagnose';
import { activityRouter } from './routes/activity';
import { usersRouter } from './routes/users';
import { historyRouter } from './routes/history';

const app = express();
const port = parseInt(process.env.PORT ?? '4000', 10);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cropguard-api' });
});

app.use('/api/diagnose', diagnoseRouter);
app.use('/api/activity', activityRouter);
app.use('/api/users', usersRouter);
app.use('/api/history', historyRouter);

// Export for serverless environments (e.g. Vercel)
export default app;

app.listen(port, () => {
  console.log(`CropGuard GH API running on http://localhost:${port}`);
});
