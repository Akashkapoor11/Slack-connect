// schedule.service.ts
import path from 'path';
import fs from 'fs/promises';
import cron from 'node-cron';
import { sendDueScheduledMessages } from './message.service';

const DB_PATH = path.resolve(__dirname, '../../db.json');

async function readDB(): Promise<any> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { tokens: [], scheduledMessages: [] };
  }
}

/**
 * Start a cron job that runs every minute and calls sendDueScheduledMessages.
 * We export startScheduler so index.ts can call it.
 */
export function startScheduler() {
  setImmediate(async () => {
    try {
      await sendDueScheduledMessages();
    } catch (err) {
      console.error('Scheduler initial run error', err);
    }
  });

  cron.schedule('* * * * *', async () => {
    try {
      console.log('Scheduler tick - checking for due messages');
      await sendDueScheduledMessages();
    } catch (err) {
      console.error('Scheduler run error', err);
    }
  });

  console.log('Scheduler started (runs every minute).');
}

/**
 * Helper: expose reading scheduled messages for debugging (optional)
 */
export async function readScheduled() {
  const db = await readDB();
  return db.scheduledMessages ?? [];
}
