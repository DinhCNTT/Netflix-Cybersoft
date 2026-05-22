import axios from 'axios';
import useProfileStore from '../store/profileStore';

const tmdbAxios = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL,
});

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Thêm interceptor để tự động chèn API key
tmdbAxios.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    api_key: API_KEY,
    language: 'vi-VN', // Mặc định trả về tiếng Việt
    include_adult: false // Luôn tắt phim cấp 3 để an toàn
  };
  return config;
});

export const tmdbRequests = {
  fetchTrending: `/trending/all/week`,
  fetchNetflixOriginals: `/discover/tv?with_networks=213`,
  fetchTopRated: `/movie/top_rated`,
  fetchActionMovies: `/discover/movie?with_genres=28`,
  fetchComedyMovies: `/discover/movie?with_genres=35`,
  fetchHorrorMovies: `/discover/movie?with_genres=27`,
  fetchRomanceMovies: `/discover/movie?with_genres=10749`,
  fetchDocumentaries: `/discover/movie?with_genres=99`,
};

export const imageUrl = 'https://image.tmdb.org/t/p/original/';

export default tmdbAxios;
