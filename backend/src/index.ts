import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './api';
import { startScheduler } from './services/schedule.service';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

// Root health-check route
app.get('/', (_req, res) => {
  res.send('Slack Connect backend is running 🚀');
});

// Mount API routes
app.use('/api', apiRouter);

// Start scheduler safely
try {
  startScheduler();
} catch (err) {
  console.error('Failed to start scheduler:', err);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
