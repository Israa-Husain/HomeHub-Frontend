import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
import { TOKEN_KEY } from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); setUser(null); };
  const refresh = async () => { const profile = await authApi.profile(); setUser(profile); return profile; };
  useEffect(() => {
    let mounted = true;
    const invalid = () => { logout(); setSessionError('Your session has ended. Please sign in again.'); };
    window.addEventListener('homehub:unauthorized', invalid);
    if (sessionStorage.getItem(TOKEN_KEY)) authApi.profile().then(profile => { if (mounted) setUser(profile); }).catch(() => { if (mounted) invalid(); }).finally(() => { if (mounted) setLoading(false); });
    else setLoading(false);
    return () => { mounted = false; window.removeEventListener('homehub:unauthorized', invalid); };
  }, []);
  async function login(body) {
    const response = await authApi.login(body);
    sessionStorage.setItem(TOKEN_KEY, response.token);
    try { await refresh(); setSessionError(''); } catch (error) { logout(); throw error; }
  }
  return <AuthContext.Provider value={{ user, loading, login, logout, refresh, sessionError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
