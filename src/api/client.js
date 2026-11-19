import axios from "axios";

function serviceBase(value, fallback) {
  return (value?.trim() || fallback).replace(/\/+$/, "").replace(/\/api$/, "");
}

const authBase = serviceBase(import.meta.env.VITE_AUTH_API_BASE_URL, "http://localhost:8081");
const bookingBase = serviceBase(import.meta.env.VITE_BOOKING_API_BASE_URL, "http://localhost:8082");
const notificationBase = serviceBase(import.meta.env.VITE_NOTIFICATION_API_BASE_URL, "http://localhost:8083");

export const notificationStreamUrl = `${notificationBase}/api/notifications/stream`;
export const TOKEN_KEY = "homehub.token";

export function expireSession(token) {
  if (token && sessionStorage.getItem(TOKEN_KEY) === token) {
    sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("homehub:unauthorized"));
  }
}

function createClient(base, isPublic = () => false) {
  const client = axios.create({
    baseURL: `${base}/api`,
    allowAbsoluteUrls: false,
    timeout: 20000,
  });
  client.interceptors.request.use((config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token && !isPublic(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, undefined, { synchronous: true });
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const authorization = error.config?.headers?.get("Authorization");
        if (authorization?.startsWith("Bearer ")) expireSession(authorization.slice(7));
      }
      return Promise.reject(error);
    },
  );
  return client;
}

export const authClient = createClient(authBase, (path) => path.startsWith("/auth/"));
export const bookingClient = createClient(bookingBase);
export const notificationClient = createClient(notificationBase);

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

export const imageUrl = (path) => path
  ? new URL(path.replace(/^\/(?=uploads\/)/, ""), new URL(`${authBase}/`, window.location.origin)).href
  : "";
