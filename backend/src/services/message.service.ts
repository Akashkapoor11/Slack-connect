// backend/src/services/message.service.ts
import fs from 'fs/promises';
import path from 'path';
import { postMessageToChannel } from './slack.service';

const DB_PATH = path.resolve(__dirname, '../../db.json');

type Scheduled = {
  id: string;
  workspace_id?: string;
  channelId: string;
  text: string;
  post_at: number | string;
  status?: 'scheduled' | 'sent' | 'cancelled';
  sent_at?: number;
};

async function readDBSafe(): Promise<any> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('db.json does not contain an object');
      // ensure keys exist
      parsed.tokens = parsed.tokens ?? [];
      parsed.scheduledMessages = parsed.scheduledMessages ?? [];
      return parsed;
    } catch (parseErr) {
      console.error('[readDBSafe] JSON parse error for', DB_PATH, parseErr);
      // If parse failed, return defaults instead of throwing so endpoints can respond
      return { tokens: [], scheduledMessages: [] };
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.warn('[readDBSafe] db.json not found, returning empty DB');
      return { tokens: [], scheduledMessages: [] };
    }
    console.error('[readDBSafe] failed to read db.json', err);
    // on other errors, also return defaults (so route doesn't crash)
    return { tokens: [], scheduledMessages: [] };
  }
}

async function writeDBSafe(db: any) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[writeDBSafe] failed to write db.json', err);
    throw err;
  }
}

/* Public service functions */

export async function scheduleMessage(payload: { channelId: string; text: string; post_at: number }) {
  const db = await readDBSafe();
  const id = `msg_${Date.now()}`;
  const entry: Scheduled = { id, channelId: payload.channelId, text: payload.text, post_at: payload.post_at, status: 'scheduled' };
  db.scheduledMessages = db.scheduledMessages ?? [];
  db.scheduledMessages.push(entry);
  await writeDBSafe(db);
  return id;
}

export async function getAllScheduled() {
  const db = await readDBSafe();
  // defensive: ensure array
  return Array.isArray(db.scheduledMessages) ? db.scheduledMessages : [];
}

export async function cancelScheduled(id: string) {
  const db = await readDBSafe();
  db.scheduledMessages = (db.scheduledMessages ?? []).map((m: any) => (m.id === id ? { ...m, status: 'cancelled' } : m));
  await writeDBSafe(db);
}

export async function sendImmediateMessage(channelId: string, text: string) {
  // call slack service - let it throw if Slack returns error (caller should handle)
  return postMessageToChannel(channelId, text);
}

/* Scheduler helper: send messages that are due */
export async function sendDueScheduledMessages() {
  const db = await readDBSafe();
  const now = Math.floor(Date.now() / 1000);
  console.log('[scheduler] now=', now);

  const pending = (db.scheduledMessages ?? []).filter((m: Scheduled) => m.status === 'scheduled');
  console.log('[scheduler] pending count=', pending.length);

  for (const msg of pending) {
    // normalize post_at to seconds
    let postAtSec = typeof msg.post_at === 'string' ? Number(msg.post_at) : msg.post_at;
    if (!Number.isFinite(postAtSec)) {
      console.warn('[scheduler] ignoring msg with invalid post_at', msg.id, msg.post_at);
      continue;
    }
    if (postAtSec > 1e12) {
      postAtSec = Math.floor(postAtSec / 1000);
      console.log('[scheduler] converted ms->s for', msg.id, postAtSec);
    }

    try {
      if (postAtSec <= now) {
        console.log('[scheduler] sending', msg.id, 'to', msg.channelId);
        try {
          const res = await postMessageToChannel(msg.channelId, msg.text);
          const ok = res && (res as any).ok;
          if (ok) {
            msg.status = 'sent';
            msg.sent_at = now;
            console.log('[scheduler] sent', msg.id);
          } else {
            console.error('[scheduler] slack response not ok for', msg.id, res);
          }
        } catch (postErr) {
          console.error('[scheduler] error posting to slack for', msg.id, postErr);
          // leave scheduled for retry
        }
      } else {
        // not due yet
      }
    } catch (outerErr) {
      console.error('[scheduler] unexpected', outerErr);
    }
  }

  try {
    await writeDBSafe(db);
  } catch (err) {
    console.error('[scheduler] failed to persist db.json', err);
  }
}
