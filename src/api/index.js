import { authClient, bookingClient, notificationClient } from "./client";

const data = (promise) => promise.then((response) => response.data);
export const get = (path, params) => data(bookingClient.get(path, { params }));
export const post = (path, body) => data(bookingClient.post(path, body));
export const put = (path, body) => data(bookingClient.put(path, body));
export const remove = (path) => data(bookingClient.delete(path));

export async function allPages(path, params = {}) {
  const first = await get(path, { ...params, page: 0, size: 100 });
  if (Array.isArray(first)) return first;
  const rows = [...first.content];
  for (let page = 1; page < first.totalPages; page++)
    rows.push(...(await get(path, { ...params, page, size: 100 })).content);
  return rows;
}

export const authApi = {
  login: (body) => data(authClient.post("/auth/login", body)),
  register: (body) => data(authClient.post("/auth/register", body)),
  verify: (token) => data(authClient.get("/auth/verify", { params: { token } })),
  forgot: (body) => data(authClient.post("/auth/forgot-password", body)),
  reset: (body) => data(authClient.post("/auth/reset-password", body)),
  profile: () => data(authClient.get("/users/profile")),
  updateProfile: (body) => data(authClient.put("/users/profile", body)),
  uploadProfilePicture: (body) => data(authClient.post("/users/profile-picture", body)),
  changePassword: (body) => data(authClient.put("/users/change-password", body)),
  users: (params) => data(authClient.get("/users", { params })),
  deactivateUser: (id) => data(authClient.delete(`/users/${id}`)),
};

export const bookingApi = {
  list: (params) => get("/booking", params),
  detail: (id) => get(`/booking/${id}`),
  create: (body) => post("/booking", body),
  cancel: (id) => remove(`/booking/${id}`),
  status: (id, status) => put(`/booking/${id}/status`, { status }),
  reschedule: (id, body) => post(`/reschedules/booking/${id}`, body),
};

export const notificationApi = {
  async history(signal) {
    const limit = 200;
    const items = new Map();
    for (let offset = 0; ; offset += limit) {
      const batch = await data(notificationClient.get("/notifications", {
        params: { limit, offset },
        signal,
      }));
      for (const item of batch) items.set(item.id, item);
      if (batch.length < limit) return [...items.values()];
    }
  },
  unread: (signal) => data(notificationClient.get("/notifications/unread-count", { signal })),
  markRead: (id) => data(notificationClient.patch(`/notifications/${id}/read`)),
};
