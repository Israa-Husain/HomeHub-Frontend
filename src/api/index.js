import { api } from "./client";
const data = (promise) => promise.then((response) => response.data);
export const get = (path, params) => data(api.get(path, { params }));
export const post = (path, body) => data(api.post(path, body));
export const put = (path, body) => data(api.put(path, body));
export const remove = (path) => data(api.delete(path));
export const patch = (path) => data(api.patch(path));
export async function allPages(path, params = {}) {
  const first = await get(path, { ...params, page: 0, size: 100 });
  if (Array.isArray(first)) return first;
  const rows = [...first.content];
  for (let page = 1; page < first.totalPages; page++)
    rows.push(...(await get(path, { ...params, page, size: 100 })).content);
  return rows;
}
export const authApi = {
  login: (body) => post("/auth/login", body),
  register: (body) => post("/auth/register", body),
  verify: (token) => get("/auth/verify", { token }),
  forgot: (body) => post("/auth/forgot-password", body),
  reset: (body) => post("/auth/reset-password", body),
  profile: () => get("/users/profile"),
};
export const bookingApi = {
  list: (params) => get("/booking", params),
  detail: (id) => get(`/booking/${id}`),
  create: (body) => post("/booking", body),
  cancel: (id) => remove(`/booking/${id}`),
  status: (id, status) => put(`/booking/${id}/status`, { status }),
  reschedule: (id, body) => post(`/reschedules/booking/${id}`, body),
};
