import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api";
import { TOKEN_KEY } from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const retrySession = () => { setLoading(true); setRestoreAttempt(value => value + 1); };
  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setRestoreError("");
    setSessionError("");
  };
  const refresh = async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const profile = await authApi.profile();
    if (sessionStorage.getItem(TOKEN_KEY) === token) setUser(profile);
    return profile;
  };
  useEffect(() => {
    let mounted = true;
    const invalid = () => {
      logout();
      setSessionError("Your session has ended. Please sign in again.");
    };
    window.addEventListener("homehub:unauthorized", invalid);
    setRestoreError("");
    const restoringToken = sessionStorage.getItem(TOKEN_KEY);
    if (restoringToken)
      authApi
        .profile()
        .then((profile) => {
          if (mounted && sessionStorage.getItem(TOKEN_KEY) === restoringToken) setUser(profile);
        })
        .catch((failure) => {
          if (!mounted || sessionStorage.getItem(TOKEN_KEY) !== restoringToken) return;
          if (failure.response?.status === 401) invalid();
          else setRestoreError(failure.response?.status === 403
            ? "HomeHub could not authorize this session. Retry or sign in with another account."
            : "We could not restore your session. Check your connection and try again.");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    else setLoading(false);
    return () => {
      mounted = false;
      window.removeEventListener("homehub:unauthorized", invalid);
    };
  }, [restoreAttempt]);
  async function login(body) {
    const response = await authApi.login(body);
    sessionStorage.setItem(TOKEN_KEY, response.token);
    try {
      await refresh();
      setRestoreError("");
      setSessionError("");
    } catch (error) {
      logout();
      throw error;
    }
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refresh, sessionError, restoreError, retrySession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
