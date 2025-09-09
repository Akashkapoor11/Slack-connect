// backend/src/services/slack.service.ts
import querystring from 'querystring';
import path from 'path';
import fs from 'fs/promises';
import { WebClient, WebAPICallResult } from '@slack/web-api';

const CLIENT_ID = process.env.SLACK_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET ?? '';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';
const SCOPES = (process.env.SLACK_SCOPES ?? 'chat:write,channels:read').split(',');

const DB_PATH = path.resolve(__dirname, '../../db.json');

export function buildSlackAuthUrl(state?: string) {
  const params = {
    client_id: CLIENT_ID,
    scope: SCOPES.join(','),
    redirect_uri: `${BASE_URL}/auth/slack/callback`,
    state: state ?? 'state-placeholder'
  };
  return `https://slack.com/oauth/v2/authorize?${querystring.stringify(params)}`;
}

export async function exchangeCodeForToken(code: string): Promise<any> {
  throw new Error('Not implemented: exchangeCodeForToken');
}

export async function refreshAccessToken(refreshToken: string): Promise<any> {
  throw new Error('Not implemented: refreshAccessToken');
}

async function readDB(): Promise<any> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { tokens: [], scheduledMessages: [] };
  }
}

export async function getPrimaryToken(): Promise<{ access_token?: string; workspace_id?: string } | null> {
  const db = await readDB();
  const tokens = db.tokens ?? [];
  if (!tokens.length) return null;
  return tokens[0];
}

export async function listChannelsForWorkspace() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const clientToken = botToken ?? (await getPrimaryToken())?.access_token;

  if (!clientToken) {
    return [
      { id: 'C123', name: 'general' },
      { id: 'C234', name: 'random' },
      { id: 'C345', name: 'engineering' }
    ];
  }

  const client = new WebClient(clientToken);
  try {
    const res = (await client.conversations.list({ limit: 200 })) as WebAPICallResult & any;
    if (!res.ok) {
      console.error('Slack conversations.list returned not ok:', (res as any).error);
      return [{ id: 'C123', name: 'general' }];
    }
    const channels = (res.channels ?? []).map((c: any) => ({ id: c.id, name: c.name }));
    return channels;
  } catch (err) {
    console.error('listChannelsForWorkspace error calling Slack API:', err);
    return [{ id: 'C123', name: 'general' }];
  }
}

/**
 * IMPORTANT: this is a named export that other modules import.
 * It prefers SLACK_BOT_TOKEN (env) and falls back to stored token.
 */
export async function postMessageToChannel(channelId: string, text: string) {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const tokenObj = await getPrimaryToken();
  const clientToken = botToken ?? tokenObj?.access_token;

  if (!clientToken) {
    console.log('(stub) Would post to', channelId, 'text:', text);
    return { ok: true, stub: true };
  }

  const client = new WebClient(clientToken);
  try {
    const res = (await client.chat.postMessage({ channel: channelId, text })) as WebAPICallResult & any;
    if (!res.ok) throw new Error(`Slack API error: ${(res as any).error}`);
    return res;
  } catch (err) {
    console.error('postMessageToChannel error', err);
    // rethrow so calling code can catch and report
    throw err;
  }
}
