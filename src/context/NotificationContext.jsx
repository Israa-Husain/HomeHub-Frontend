import { createContext, useContext, useEffect, useState } from "react";
import { get, patch } from "../api";
import { API_BASE, TOKEN_KEY, errorMessage } from "../api/client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("Connecting");
  const [revision, setRevision] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const refresh = () => setRefreshIndex((value) => value + 1);
  useEffect(() => {
    if (!user) {
      setItems([]);
      setCount(0);
      setOwnerId(null);
      setLoaded(false);
      setLoading(false);
      setError("");
      setConnection("Disconnected");
      return;
    }
    let current = true;
    setLoading(true);
    if (ownerId !== user.id) {
      setOwnerId(user.id);
      setItems([]);
      setCount(0);
      setLoaded(false);
      setError("");
    }
    Promise.all([get("/notifications"), get("/notifications/unread-count")])
      .then(([history, unread]) => {
        if (current) {
          setOwnerId(user.id);
          setLoaded(true);
          setItems(history);
          setCount(unread.count);
          setError("");
        }
      })
      .catch((failure) => {
        if (current) { setOwnerId(user.id); setError(errorMessage(failure)); }
      }).finally(() => { if (current) setLoading(false); });
    return () => {
      current = false;
    };
  }, [user?.id, refreshIndex]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    let retry;
    let attempt = 0;
    let watchdog;
    async function connect() {
      try {
        setConnection("Connecting");
        const streamToken = sessionStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/notifications/stream`, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${streamToken}`,
          },
          signal: controller.signal,
        });
        if (response.status === 401) {
          if (!controller.signal.aborted && streamToken === sessionStorage.getItem(TOKEN_KEY))
            window.dispatchEvent(new Event("homehub:unauthorized"));
          return;
        }
        if (!response.ok || !response.body)
          throw new Error("Stream unavailable");
        if (!controller.signal.aborted) { setConnection("Live"); refresh(); }
        attempt = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replaceAll("\r\n", "\n");
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (/^data:/m.test(event)) {
              refresh();
              setRevision((value) => value + 1);
            }
          }
        }
      } catch {
        /* History polling remains available while the stream reconnects. */
      }
      if (!controller.signal.aborted) {
        setConnection("Reconnecting");
        retry = setTimeout(connect, Math.min(30000, 2000 * 2 ** attempt++));
      }
    }
    connect();
    watchdog = setInterval(() => {
      refresh();
      setRevision((value) => value + 1);
    }, 60000);
    return () => {
      controller.abort();
      clearTimeout(retry);
      clearInterval(watchdog);
    };
  }, [user?.id]);
  async function markRead(id) {
    await patch(`/notifications/${id}/read`);
    refresh();
  }
  return (
    <NotificationContext.Provider
      value={{ items: ownerId === user?.id ? items : [], count: ownerId === user?.id ? count : 0,
        error: ownerId === user?.id ? error : "", connection, revision, refresh, markRead,
        loading: !!user && (ownerId !== user.id || loading), loaded: ownerId === user?.id && loaded }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
export const useNotifications = () => useContext(NotificationContext);
