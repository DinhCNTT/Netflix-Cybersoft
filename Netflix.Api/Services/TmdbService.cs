using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Netflix.Api.DTOs.Tmdb;

namespace Netflix.Api.Services
{
    public class TmdbService : ITmdbService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public TmdbService(HttpClient httpClient, IConfiguration configuration, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
            _apiKey = configuration["Tmdb:ApiKey"] ?? throw new ArgumentNullException("Tmdb:ApiKey is missing");
            _baseUrl = configuration["Tmdb:BaseUrl"] ?? "https://api.themoviedb.org/3";
        }

        private async Task<T?> GetAsync<T>(string endpoint)
        {
            var separator = endpoint.Contains("?") ? "&" : "?";
            var url = $"{_baseUrl}{endpoint}{separator}api_key={_apiKey}&language=vi-VN&include_adult=false";
            
            // Lấy từ cache nếu có
            var cacheKey = $"TMDB_{url}";
            if (_cache.TryGetValue(cacheKey, out object cachedObj))
            {
                if (cachedObj is T cachedTyped) return cachedTyped;
            }

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return default;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var result = JsonSerializer.Deserialize<T>(content, options);

            // Lưu vào cache
            if (result != null)
            {
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
            }

            return result;
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> GetTrendingMoviesAsync(bool isKids = false)
        {
            if (isKids)
            {
                // Sử dụng discover để lọc phim an toàn cho trẻ em. Bắt buộc là Hoạt hình (16) hoặc Gia đình (10751)
                return await GetAsync<TmdbResponseDto<TmdbMovieDto>>("/discover/movie?certification_country=US&certification.lte=PG&with_genres=16|10751&sort_by=popularity.desc") 
                       ?? new TmdbResponseDto<TmdbMovieDto>();
            }
            return await GetAsync<TmdbResponseDto<TmdbMovieDto>>("/trending/all/day") 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> GetNewReleasesAsync(bool isKids = false)
        {
            var dateLte = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var dateGte = DateTime.UtcNow.AddMonths(-1).ToString("yyyy-MM-dd");
            
            var endpoint = $"/discover/movie?primary_release_date.gte={dateGte}&primary_release_date.lte={dateLte}";
            if (isKids)
            {
                endpoint += "&certification_country=US&certification.lte=PG&with_genres=16|10751";
            }
            
            return await GetAsync<TmdbResponseDto<TmdbMovieDto>>(endpoint) 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> GetMoviesByGenreAsync(int genreId, bool isKids = false)
        {
            var endpoint = $"/discover/movie?with_genres={genreId}";
            if (isKids)
            {
                // NẾU LÀ TRẺ EM: Bắt buộc thể loại này phải kết hợp với Hoạt hình (16)
                // Ví dụ: Hài hước (35) + Hoạt hình (16) -> Phim hoạt hình hài hước (an toàn tuyệt đối)
                // Điều này chặn hoàn toàn các phim người lớn không dán nhãn bị lọt lưới TMDB
                endpoint = $"/discover/movie?with_genres={genreId},16&certification_country=US&certification.lte=PG";
            }
            
            return await GetAsync<TmdbResponseDto<TmdbMovieDto>>(endpoint) 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> DiscoverMoviesAsync(string withGenres = "", string withOriginCountry = "", string withKeywords = "", string withOriginalLanguage = "", bool isKids = false)
        {
            var endpoint = "/discover/movie?sort_by=popularity.desc";
            
            var finalGenres = withGenres;
            if (isKids)
            {
                endpoint += "&certification_country=US&certification.lte=PG";
                // Ép buộc kết hợp với thể loại Hoạt hình (16) để an toàn 100%
                if (string.IsNullOrEmpty(finalGenres)) finalGenres = "16";
                else if (!finalGenres.Contains("16")) finalGenres += ",16";
            }
            
            if (!string.IsNullOrEmpty(finalGenres)) endpoint += $"&with_genres={finalGenres}";
            if (!string.IsNullOrEmpty(withOriginCountry)) endpoint += $"&with_origin_country={withOriginCountry}";
            if (!string.IsNullOrEmpty(withKeywords)) endpoint += $"&with_keywords={withKeywords}";
            if (!string.IsNullOrEmpty(withOriginalLanguage)) endpoint += $"&with_original_language={withOriginalLanguage}";
            
            return await GetAsync<TmdbResponseDto<TmdbMovieDto>>(endpoint) 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> DiscoverTvShowsAsync(string withGenres = "", string withOriginCountry = "", string withKeywords = "", string withOriginalLanguage = "", bool isKids = false)
        {
            var endpoint = "/discover/tv?sort_by=popularity.desc";
            
            var finalGenres = withGenres;
            if (isKids)
            {
                // Truyền hình cho trẻ em ép buộc dùng Hoạt hình (16)
                if (string.IsNullOrEmpty(finalGenres)) finalGenres = "16";
                else if (!finalGenres.Contains("16")) finalGenres += ",16";
            }
            
            if (!string.IsNullOrEmpty(finalGenres)) endpoint += $"&with_genres={finalGenres}";
            if (!string.IsNullOrEmpty(withOriginCountry)) endpoint += $"&with_origin_country={withOriginCountry}";
            if (!string.IsNullOrEmpty(withKeywords)) endpoint += $"&with_keywords={withKeywords}";
            if (!string.IsNullOrEmpty(withOriginalLanguage)) endpoint += $"&with_original_language={withOriginalLanguage}";
            
            return await GetAsync<TmdbResponseDto<TmdbMovieDto>>(endpoint) 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> GetMovieRecommendationsAsync(int movieId, bool isKids = false)
        {
            var endpoint = $"/movie/{movieId}/recommendations";
            
            // TMDB recommendations endpoint doesn't support strict genre/certification filtering easily.
            // But we will pass it anyway, or rely on client-side filtering.
            // For now we just call it.
            var response = await GetAsync<TmdbResponseDto<TmdbMovieDto>>(endpoint) 
                   ?? new TmdbResponseDto<TmdbMovieDto>();
                   
            if (isKids) {
                 response.Results = response.Results.Where(m => m.Genre_Ids != null && m.Genre_Ids.Contains(16)).ToList();
            }
            
            return response;
        }

        public async Task<TmdbMovieDto?> GetMovieDetailsAsync(int tmdbId)
        {
            // Note: Since trending can return tv shows, we might need to handle /tv/{id} as well, 
            // but for simplicity we assume /movie. Ideally we check media_type.
            var movie = await GetAsync<TmdbMovieDto>($"/movie/{tmdbId}?append_to_response=credits,release_dates");
            // If it's a TV show, TMDB might return success but without Title (it has Name instead) or it returns 404.
            // A safer check for movie is if it has a Title (since TV shows use Name).
            if (movie != null && !string.IsNullOrEmpty(movie.Title))
            {
                return movie;
            }
            
            // Fallback to TV show if movie is not found
            var tvShow = await GetAsync<TmdbMovieDto>($"/tv/{tmdbId}?append_to_response=credits,content_ratings");
            return tvShow;
        }

        public async Task<TmdbGenreResponseDto> GetGenresAsync()
        {
            return await GetAsync<TmdbGenreResponseDto>("/genre/movie/list") 
                   ?? new TmdbGenreResponseDto();
        }

        public async Task<TmdbMovieDto?> GetTvShowDetailsAsync(int tmdbId)
        {
            // Gọi /tv/{id} với credits và content_ratings để lấy đầy đủ thông tin
            var result = await GetAsync<TmdbMovieDto>($"/tv/{tmdbId}?append_to_response=credits,content_ratings");
            if (result != null) result.Media_Type = "tv";
            return result;
        }

        public async Task<TmdbResponseDto<TmdbMovieDto>> SearchMultiAsync(string query)
        {
            var encoded = Uri.EscapeDataString(query);
            var result = await GetAsync<TmdbResponseDto<TmdbMovieDto>>($"/search/multi?query={encoded}");
            if (result != null)
            {
                // Loại bỏ kết quả kiểu "person" và nội dung người lớn
                result.Results = result.Results
                    .Where(m => m.Media_Type != "person" && !m.Adult)
                    .ToList();
            }
            return result ?? new TmdbResponseDto<TmdbMovieDto>();
        }
    }
}
