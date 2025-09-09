// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export const getChannels = async () => {
  const res = await axios.get(`${API_BASE}/channels`);
  return res.data;
};

export const sendMessage = async (channelId: string, text: string) => {
  const res = await axios.post(`${API_BASE}/messages/send`, { channelId, text });
  return res.data;
};

export const scheduleMessage = async (channelId: string, text: string, post_at: number) => {
  const res = await axios.post(`${API_BASE}/messages/schedule`, { channelId, text, post_at });
  return res.data;
};

export const getScheduledMessages = async () => {
  const res = await axios.get(`${API_BASE}/messages/scheduled`);
  return res.data;
};

export const cancelScheduledMessage = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/messages/scheduled/${id}`);
  return res.data;
};


