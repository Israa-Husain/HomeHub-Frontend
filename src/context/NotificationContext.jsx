import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { notificationApi } from "../api";
import { errorMessage, expireSession, notificationStreamUrl, TOKEN_KEY } from "../api/client";
import { readNotificationEvents } from "../api/notificationStream";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const token = user ? sessionStorage.getItem(TOKEN_KEY) : null;
  const [items, setItems] = useState([]);
  const [ownerToken, setOwnerToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState("");
  const [connection, setConnection] = useState("Disconnected");
  const [revision, setRevision] = useState(0);
  const syncHistory = useRef(null);
  const refresh = useCallback(() => syncHistory.current?.(true), []);

  useEffect(() => {
    setItems([]);
    setCount(0);
    setOwnerToken(token);
    setLoaded(false);
    setError("");
    setLoading(false);
    if (!token) return;

    const controller = new AbortController();
    const { signal } = controller;
    const active = () => !signal.aborted && token === sessionStorage.getItem(TOKEN_KEY);
    let running = false;
    let pending = false;

    // Serialize refreshes so a slow response cannot overwrite a newer snapshot.
    async function sync(showLoading = false) {
      if (!active()) return;
      pending = true;
      if (showLoading) setLoading(true);
      if (running) return;
      running = true;

      while (pending && active()) {
        pending = false;
        try {
          const [history, unread] = await Promise.all([
            notificationApi.history(signal),
            notificationApi.unread(signal),
          ]);
          if (!active()) break;
          setItems(history);
          setCount(unread.count);
          setLoaded(true);
          setError("");
        } catch (failure) {
          if (active()) setError(errorMessage(failure));
        }
        if (active()) setLoading(false);
      }
      running = false;
    }

    syncHistory.current = sync;
    sync(true);
    return () => {
      syncHistory.current = null;
      controller.abort();
    };
  }, [token]);

  useEffect(() => {
    setStreamError("");
    if (!token) {
      setConnection("Disconnected");
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const active = () => !signal.aborted && token === sessionStorage.getItem(TOKEN_KEY);
    const seen = new Set();
    let attempt = 0;
    let retry;
    let newBookingEvent = false;

    function reconcile() {
      syncHistory.current?.();
      if (newBookingEvent) {
        newBookingEvent = false;
        setRevision((value) => value + 1);
      }
    }

    async function connect() {
      if (!active()) return;
      try {
        const response = await fetch(notificationStreamUrl, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal,
        });
        if (!active()) return;
        if (!response.ok) {
          await response.body?.cancel();
          if (!active()) return;
          if (response.status === 401) {
            expireSession(token);
            return;
          }
          if (response.status === 403) {
            setConnection("Disconnected");
            setStreamError("You don't have permission to subscribe to live updates.");
            return;
          }
          throw new Error("Stream unavailable");
        }
        if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
          await response.body?.cancel();
          throw new Error("Expected a notification event stream");
        }

        setConnection("Live");
        reconcile();
        await readNotificationEvents(response.body, (type, id) => {
          if (!active()) return;
          if (type === "booking" && id && !seen.has(id)) {
            seen.add(id);
            newBookingEvent = true;
          }
          // The service sends a refresh marker after each batch of booking events.
          if (type === "refresh") {
            attempt = 0;
            reconcile();
          }
        });
      } catch {
        // History remains available while the stream reconnects.
      }
      if (active()) {
        if (newBookingEvent) reconcile();
        setConnection("Reconnecting");
        retry = setTimeout(connect, Math.min(30000, 2000 * 2 ** Math.min(attempt++, 4)));
      }
    }

    setConnection("Connecting");
    connect();
    const fallback = setInterval(() => {
      if (!active()) return;
      reconcile();
      setRevision((value) => value + 1);
    }, 60000);
    return () => {
      controller.abort();
      clearTimeout(retry);
      clearInterval(fallback);
    };
  }, [token]);

  async function markRead(id) {
    await notificationApi.markRead(id);
    if (sessionStorage.getItem(TOKEN_KEY) === token) refresh();
  }

  const ownsHistory = !!token && ownerToken === token;
  return (
    <NotificationContext.Provider
      value={{
        items: ownsHistory ? items : [],
        count: ownsHistory ? count : 0,
        error: ownsHistory ? error || streamError : "",
        connection,
        revision,
        refresh,
        markRead,
        loading: !!token && (!ownsHistory || loading),
        loaded: ownsHistory && loaded,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
export const useNotifications = () => useContext(NotificationContext);
