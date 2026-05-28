import axiosClient from "./axiosClient";

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) return response.data.data;
  return response.data;
};

export const watchApi = {
  async getMovieSeasons(movieId) {
    const response = await axiosClient.get(`/movies/${movieId}/seasons`);
    return unwrapData(response);
  },

  async getWatchHistory() {
    const response = await axiosClient.get("/watch-history");
    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  },

  async upsertWatchHistory(payload) {
    return axiosClient.post("/watch-history", payload);
  },
};
