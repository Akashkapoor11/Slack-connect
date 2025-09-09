import express from 'express';
import { 
  sendImmediateMessage, 
  scheduleMessage, 
  getAllScheduled, 
  cancelScheduled 
} from '../services/message.service';

const router = express.Router();

// Send message immediately
router.post('/send', async (req, res) => {
  const { channelId, text } = req.body;
  if (!channelId || !text) {
    return res.status(400).json({ error: 'channelId and text required' });
  }
  try {
    const result = await sendImmediateMessage(channelId, text);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error('Failed to send message', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Schedule message
router.post('/schedule', async (req, res) => {
  const { channelId, text, post_at } = req.body;
  if (!channelId || !text || !post_at) {
    return res.status(400).json({ error: 'channelId, text, post_at required' });
  }
  try {
    const id = await scheduleMessage({ channelId, text, post_at });
    res.json({ ok: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to schedule message' });
  }
});

// Get scheduled
router.get('/scheduled', async (_req, res) => {
  try {
    const messages = await getAllScheduled();
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Failed to read scheduled messages' });
  }
});

// Cancel scheduled
router.delete('/scheduled/:id', async (req, res) => {
  try {
    await cancelScheduled(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to cancel message' });
  }
});

export default router;
