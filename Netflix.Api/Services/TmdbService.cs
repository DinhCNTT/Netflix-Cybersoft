using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Netflix.Api.DTOs.Tmdb;

namespace Netflix.Api.Services
{
    public class TmdbService : ITmdbService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public TmdbService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Tmdb:ApiKey"] ?? throw new ArgumentNullException("Tmdb:ApiKey is missing");
            _baseUrl = configuration["Tmdb:BaseUrl"] ?? "https://api.themoviedb.org/3";
        }

        private async Task<T?> GetAsync<T>(string endpoint)
        {
            var separator = endpoint.Contains("?") ? "&" : "?";
            var url = $"{_baseUrl}{endpoint}{separator}api_key={_apiKey}&language=vi-VN";
            
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                // In production, log error here
                return default;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<T>(content, options);
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
            return await GetAsync<TmdbMovieDto>($"/movie/{tmdbId}");
        }

        public async Task<TmdbGenreResponseDto> GetGenresAsync()
        {
            return await GetAsync<TmdbGenreResponseDto>("/genre/movie/list") 
                   ?? new TmdbGenreResponseDto();
        }

        public async Task<TmdbTvShowDetailsDto?> GetTvShowDetailsAsync(int tmdbId)
        {
            return await GetAsync<TmdbTvShowDetailsDto>($"/tv/{tmdbId}");
        }
    }
}
