import axios from "axios";
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
export const TOKEN_KEY = "homehub.token";
export const api = axios.create({ baseURL: API_BASE, timeout: 20000 });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token && !config.url.startsWith("/auth/"))
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url.startsWith("/auth/")
    ) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("homehub:unauthorized"));
    }
    return Promise.reject(error);
  },
);
export function errorMessage(error) {
  return (
    error.response?.data?.message ||
    {
      400: "Please check the form fields.",
      401: "Please sign in again. Your session may have expired or your account may be inactive.",
      403: "You don't have permission to perform this action.",
      404: "This record could not be found.",
      409: "This change conflicts with an existing record.",
      422: "This action is not available for this appointment.",
      429: "Too many requests. Please try again shortly.",
      500: "The server could not complete this request.",
    }[error.response?.status] ||
    "Could not connect to HomeHub. Please check your connection and try again."
  );
}
export const imageUrl = (path) =>
  path ? new URL(path, new URL(API_BASE, window.location.origin)).href : "";
