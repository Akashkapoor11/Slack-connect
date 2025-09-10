// frontend/src/services/api.ts
import axios from "axios";

/**
 * Pick backend URL from environment or fallback to deployed Render URL
 */
const API =
  (process.env.REACT_APP_BACKEND_URL as string | undefined) ||
  (process.env.REACT_APP_API_URL as string | undefined) ||
  "https://slack-connect-h0o6.onrender.com";

console.log("[DEBUG] FRONTEND API base URL =", API);

// Configure axios
axios.defaults.baseURL = API;
// Disable cookies/credentials since backend uses Access-Control-Allow-Origin: *
axios.defaults.withCredentials = false;
console.log("[DEBUG] axios.withCredentials =", axios.defaults.withCredentials);

/**
 * API functions
 */
export const getChannels = async () => {
  try {
    const res = await axios.get("/api/channels");
    console.log("[DEBUG] /api/channels status:", res.status, "data:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("[DEBUG] getChannels error:", err?.response?.data ?? err.message ?? err);
    throw new Error(err?.response?.data?.error || err.message || "Network Error");
  }
};

export const sendMessage = async (channelId: string, text: string) => {
  try {
    const res = await axios.post("/api/messages/send", { channelId, text });
    console.log("[DEBUG] /api/messages/send status:", res.status, "data:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("[DEBUG] sendMessage error:", err?.response?.data ?? err.message ?? err);
    throw new Error(err?.response?.data?.error || err.message || "Network Error");
  }
};

export const scheduleMessage = async (channelId: string, text: string, post_at: number) => {
  try {
    const res = await axios.post("/api/messages/schedule", { channelId, text, post_at });
    console.log("[DEBUG] /api/messages/schedule status:", res.status, "data:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("[DEBUG] scheduleMessage error:", err?.response?.data ?? err.message ?? err);
    throw new Error(err?.response?.data?.error || err.message || "Network Error");
  }
};

export const getScheduledMessages = async () => {
  try {
    const res = await axios.get("/api/messages/scheduled");
    console.log("[DEBUG] /api/messages/scheduled status:", res.status, "data:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("[DEBUG] getScheduledMessages error:", err?.response?.data ?? err.message ?? err);
    throw new Error(err?.response?.data?.error || err.message || "Network Error");
  }
};

export const cancelScheduledMessage = async (id: string) => {
  try {
    const res = await axios.delete(`/api/messages/scheduled/${id}`);
    console.log("[DEBUG] DELETE /api/messages/scheduled/:id status:", res.status, "data:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("[DEBUG] cancelScheduledMessage error:", err?.response?.data ?? err.message ?? err);
    throw new Error(err?.response?.data?.error || err.message || "Network Error");
  }
};
