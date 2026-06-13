import axiosClient from "./axiosClient";

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) return response.data.data;
  return response.data;
};

export const adminApi = {
  // ─── Users ───────────────────────────────────────────────
  async getUsers({ page = 1, pageSize = 20, search = "" } = {}) {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.set("search", search);
    const res = await axiosClient.get(`/admin/users?${params}`);
    return unwrapData(res);
  },

  async getUser(id) {
    const res = await axiosClient.get(`/admin/users/${id}`);
    return unwrapData(res);
  },

  async updateUserRole(id, role) {
    const res = await axiosClient.patch(`/admin/users/${id}/role`, { role });
    return unwrapData(res);
  },

  async toggleUserActive(id, isActive) {
    const res = await axiosClient.patch(`/admin/users/${id}/active`, {
      isActive,
    });
    return unwrapData(res);
  },

  async revokeUserSessions(id) {
    const res = await axiosClient.delete(`/admin/users/${id}/sessions`);
    return unwrapData(res);
  },

  // ─── Movies ──────────────────────────────────────────────
  async getMovies({ page = 1, pageSize = 20, search = "" } = {}) {
    const params = new URLSearchParams({ page, pageSize });
    if (search) params.set("search", search);
    const res = await axiosClient.get(`/admin/movies?${params}`);
    return unwrapData(res);
  },

  async upsertMovie(data) {
    const res = await axiosClient.post("/admin/movies", data);
    return unwrapData(res);
  },

  async toggleMovieActive(id, isActive) {
    const res = await axiosClient.patch(
      `/admin/movies/${id}/active`,
      isActive,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return unwrapData(res);
  },

  async deleteMovie(id) {
    const res = await axiosClient.delete(`/admin/movies/${id}`);
    return unwrapData(res);
  },

  // ─── Analytics ───────────────────────────────────────────
  async getSummary() {
    const res = await axiosClient.get("/admin/analytics/summary");
    return unwrapData(res);
  },

  async getWatchStats() {
    const res = await axiosClient.get("/admin/analytics/watch-stats");
    return unwrapData(res);
  },
};
