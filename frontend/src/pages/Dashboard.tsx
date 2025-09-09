import React, { useEffect, useState } from "react";
import {
  getChannels,
  sendMessage,
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  // runScheduler, // optional if you added that debug endpoint
} from "../services/api";
import "./Dashboard.css"; // optional - keep if you have styles

type Channel = { id: string; name: string };
type Msg = {
  id: string;
  channelId: string;
  text: string;
  post_at: number; // unix seconds
  status: "scheduled" | "sent" | "cancelled";
  sent_at?: number;
};

export default function Dashboard(): React.JSX.Element {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [postAt, setPostAt] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16); // datetime-local format
  });
  const [scheduled, setScheduled] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const ch = await getChannels();
        setChannels(ch);
        if (ch && ch.length && !channelId) setChannelId(ch[0].id);
      } catch (err) {
        console.error("Failed to load channels", err);
      }

      await refreshScheduled();
    })();

    const id = setInterval(() => {
      refreshScheduled();
    }, 10_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshScheduled = async () => {
    try {
      const list = await getScheduledMessages();
      // ensure post_at numeric and sort newest first
      const normalized = (list || []).map((m: any) => ({
        ...m,
        post_at: typeof m.post_at === "string" ? Number(m.post_at) : m.post_at,
      }));
      normalized.sort((a: Msg, b: Msg) => b.post_at - a.post_at);
      setScheduled(normalized);
    } catch (err) {
      console.error("Failed to load scheduled messages", err);
    }
  };

  const handleSendNow = async () => {
    if (!channelId || !text) return alert("Channel and message required");
    setLoading(true);
    try {
      await sendMessage(channelId, text);

      // immediately reflect in UI as 'sent'
      const newMsg: Msg = {
        id: `local_${Date.now()}`,
        channelId,
        text,
        post_at: Math.floor(Date.now() / 1000),
        status: "sent",
        sent_at: Math.floor(Date.now() / 1000),
      };
      setScheduled((prev: Msg[]) => [newMsg, ...prev]);
      setText("");
    } catch (err: any) {
      console.error("Send failed", err);
      alert(err?.response?.data?.error || err?.message || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    // normalize and validate inputs
    if (!channelId || !text || !postAt) return alert("channel, message and date/time required");

    // turn datetime-local into milliseconds then seconds
    const normalized = postAt.includes("T") ? postAt : postAt.replace(" ", "T");
    const ms = Date.parse(normalized);
    if (Number.isNaN(ms)) return alert("Invalid date/time — choose a valid future time.");
    const postAtSec = Math.floor(ms / 1000);
    const nowSec = Math.floor(Date.now() / 1000);
    if (postAtSec <= nowSec) return alert("Please choose a future date/time.");

    setLoading(true);
    try {
      const res = await scheduleMessage(channelId, text, postAtSec);
      // build typed Msg using server id if provided
      const newEntry: Msg = {
        id: String((res && (res as any).id) || `local_${Date.now()}`),
        channelId,
        text,
        post_at: postAtSec,
        status: "scheduled",
      };
      setScheduled((prev: Msg[]) => [newEntry, ...prev]);
      setText("");

      // reset postAt to next default (now + 5min)
      const next = new Date();
      next.setMinutes(next.getMinutes() + 5);
      setPostAt(next.toISOString().slice(0, 16));

      alert("Message scheduled");
    } catch (err: any) {
      console.error("Schedule failed", err);
      alert(err?.response?.data?.error || err?.message || "Schedule failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this scheduled message?")) return;
    try {
      await cancelScheduledMessage(id);
      setScheduled((prev) => prev.map((m) => (m.id === id ? { ...m, status: "cancelled" } : m)));
    } catch (err) {
      console.error("Cancel failed", err);
      alert("Cancel failed");
    }
  };

  return (
    <div className="dashboard-root" style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Slack Connect — Dashboard</h1>
        <p style={{ color: "#666", marginTop: 6 }}>Send or schedule messages to your Slack channels</p>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <section style={{ padding: 18, borderRadius: 12, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)} style={{ padding: 8, borderRadius: 8, minWidth: 260 }}>
              <option value="">-- Select channel --</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <textarea
              placeholder="Write your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: "100%", minHeight: 120, borderRadius: 10, padding: 12, marginBottom: 12 }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <input type="datetime-local" value={postAt} onChange={(e) => setPostAt(e.target.value)} style={{ padding: 8, borderRadius: 8 }} />
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={handleSendNow} disabled={loading} className="btn primary">
                Send Now
              </button>
              <button onClick={handleSchedule} disabled={loading} className="btn outline">
                Schedule
              </button>
            </div>
          </div>
        </section>

        <aside style={{ padding: 18, borderRadius: 12, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Scheduled Messages</h3>
            <button onClick={refreshScheduled} className="btn subtle">
              Refresh
            </button>
          </div>

          {scheduled.length === 0 ? (
            <div style={{ color: "#666" }}>No scheduled messages</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {scheduled.map((m) => (
                <li key={m.id} style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(0,0,0,0.04)", background: m.status === "sent" ? "#e6ffed" : m.status === "cancelled" ? "#fee2e2" : "#eef2ff" }}>
                  <div style={{ fontWeight: 600 }}>{m.text}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                    <span style={{ marginRight: 8 }} className="chip">{m.channelId}</span>
                    <span style={{ marginRight: 8 }}>{new Date(m.post_at * 1000).toLocaleString()}</span>
                    <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{m.status}</span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {m.status === "scheduled" && (
                      <button onClick={() => handleCancel(m.id)} className="btn danger">
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      <footer style={{ marginTop: 18, color: "#777" }}>made by Akash Kapoor</footer>
    </div>
  );
}
