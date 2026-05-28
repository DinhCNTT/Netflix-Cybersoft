import axiosClient from "./axiosClient";

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) return response.data.data;
  return response.data;
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const API_ORIGIN = (axiosClient.defaults.baseURL || "").replace(
  /\/api\/?$/,
  "",
);

const normalizeMediaUrl = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (!API_ORIGIN) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  return `${API_ORIGIN}/${value}`;
};

const mapMovie = (movie) => ({
  id: movie?.id,
  title: movie?.title || movie?.name || "Untitled",
  overview: movie?.description || movie?.overview || "",
  posterUrl: normalizeMediaUrl(movie?.posterUrl || movie?.poster_path),
  backdropUrl: normalizeMediaUrl(movie?.backdropUrl || movie?.backdrop_path),
  maturityLevel: movie?.maturityLevel || "PG-13",
  releaseYear: movie?.releaseYear || movie?.year || null,
  trailerUrl: normalizeMediaUrl(movie?.trailerUrl),
  genreIds: movie?.genreIds || [],
  genreNames: movie?.genreNames || [],
});

const mapGenre = (genre) => ({
  id: genre?.id,
  name: genre?.name || "Unknown",
});

const mapSeason = (season) => ({
  id: season?.id,
  seasonNumber: season?.seasonNumber || 1,
  title: season?.title || `Season ${season?.seasonNumber || 1}`,
  episodes: safeArray(season?.episodes).map((episode) => ({
    id: episode?.id,
    episodeNumber: episode?.episodeNumber || 1,
    title: episode?.title || `Episode ${episode?.episodeNumber || 1}`,
    videoUrl: normalizeMediaUrl(episode?.videoUrl),
    durationMinutes: episode?.durationMinutes || 0,
    subtitleUrl: normalizeMediaUrl(episode?.subtitleUrl),
  })),
});

export const movieApi = {
  async getFeaturedMovie() {
    const response = await axiosClient.get("/movies/featured");
    const data = unwrapData(response);
    return data ? mapMovie(data) : null;
  },

  async getTrendingMovies() {
    const response = await axiosClient.get("/movies/trending");
    return safeArray(unwrapData(response)).map(mapMovie);
  },

  async getNewReleases() {
    const response = await axiosClient.get("/movies/new-releases");
    return safeArray(unwrapData(response)).map(mapMovie);
  },

  async getNetflixOriginals() {
    const response = await axiosClient.get("/movies/netflix-originals");
    return safeArray(unwrapData(response)).map(mapMovie);
  },

  async getGenres() {
    const response = await axiosClient.get("/genres");
    return safeArray(unwrapData(response)).map(mapGenre);
  },

  async getMoviesByGenre(genreId) {
    const response = await axiosClient.get(`/movies/by-genre/${genreId}`);
    return safeArray(unwrapData(response)).map(mapMovie);
  },

  async getMovieById(movieId) {
    const response = await axiosClient.get(`/movies/${movieId}`);
    const data = unwrapData(response);
    return data ? mapMovie(data) : null;
  },

  async getMyList() {
    const response = await axiosClient.get("/mylist");
    const payload = unwrapData(response);

    if (Array.isArray(payload)) {
      return payload.map(mapMovie);
    }

    return safeArray(payload?.items).map(mapMovie);
  },

  async getFavouriteIds() {
    const response = await axiosClient.get("/mylist");
    const payload = unwrapData(response);

    if (Array.isArray(payload)) {
      return payload.map((movie) => movie?.id).filter(Boolean);
    }

    return safeArray(payload?.ids);
  },

  async addFavourite(movieId) {
    const response = await axiosClient.post("/mylist", { movieId });
    return safeArray(unwrapData(response));
  },

  async removeFavourite(movieId) {
    const response = await axiosClient.delete("/mylist", {
      data: { movieId },
    });
    return safeArray(unwrapData(response));
  },

  async rateMovie(movieId, value) {
    const response = await axiosClient.post("/ratings", { movieId, value });
    return unwrapData(response);
  },

  async getMovieRating(movieId) {
    const response = await axiosClient.get(`/ratings/movie/${movieId}`);
    const rating = unwrapData(response);

    return {
      movieId: rating?.movieId || movieId,
      likeCount: rating?.likeCount || 0,
      dislikeCount: rating?.dislikeCount || 0,
      userRating: rating?.userRating ?? null,
      matchPercent: rating?.matchPercent || 95,
    };
  },

  async getMovieSeasons(movieId) {
    const response = await axiosClient.get(`/movies/${movieId}/seasons`);
    const data = unwrapData(response);
    return safeArray(data?.seasons).map(mapSeason);
  },

  async getSimilarMovies(movieId) {
    const response = await axiosClient.get(`/movies/${movieId}/similar`);
    return safeArray(unwrapData(response)).map(mapMovie);
  },
};
