import { createContext, useContext, useEffect, useState } from 'react';
import { get, patch } from '../api';
import { API_BASE, TOKEN_KEY, errorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('Connecting');
  const [revision, setRevision] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const refresh = () => setRefreshIndex(value => value + 1);
  useEffect(() => {
    if (!user) { setItems([]); setCount(0); return; }
    let current = true;
    Promise.all([get('/notifications'), get('/notifications/unread-count')]).then(([history, unread]) => {
      if (current) { setItems(history); setCount(unread.count); setError(''); }
    }).catch(failure => { if (current) setError(errorMessage(failure)); });
    return () => { current = false; };
  }, [user?.id, refreshIndex]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    let retry;
    let attempt = 0;
    let watchdog;
    async function connect() {
      try {
        setConnection('Connecting');
        const response = await fetch(`${API_BASE}/notifications/stream`, {
          headers: { Accept: 'text/event-stream', Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY)}` }, signal: controller.signal,
        });
        if (response.status === 401) { window.dispatchEvent(new Event('homehub:unauthorized')); return; }
        if (!response.ok || !response.body) throw new Error('Stream unavailable');
        if (!controller.signal.aborted) setConnection('Live');
        attempt = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n');
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            if (/^data:/m.test(event)) { refresh(); setRevision(value => value + 1); }
          }
        }
      } catch { /* History polling remains available while the stream reconnects. */ }
      if (!controller.signal.aborted) {
        setConnection('Reconnecting');
        retry = setTimeout(connect, Math.min(30000, 2000 * 2 ** attempt++));
      }
    }
    connect();
    watchdog = setInterval(() => { refresh(); setRevision(value => value + 1); }, 60000);
    return () => { controller.abort(); clearTimeout(retry); clearInterval(watchdog); };
  }, [user?.id]);
  async function markRead(id) { await patch(`/notifications/${id}/read`); refresh(); }
  return <NotificationContext.Provider value={{ items, count, error, connection, revision, refresh, markRead }}>{children}</NotificationContext.Provider>;
}
export const useNotifications = () => useContext(NotificationContext);
