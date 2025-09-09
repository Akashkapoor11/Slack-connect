import { Router } from 'express';
import { listChannelsForWorkspace } from '../services/slack.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const channels = await listChannelsForWorkspace();
    res.json(channels);
  } catch (err) {
    console.error('GET /api/channels error', err);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

export default router;
