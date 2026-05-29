using Netflix.Api.DTOs.Tmdb;

namespace Netflix.Api.Services
{
    public interface ITmdbService
    {
        Task<TmdbResponseDto<TmdbMovieDto>> GetTrendingMoviesAsync(bool isKids = false);
        Task<TmdbResponseDto<TmdbMovieDto>> GetNewReleasesAsync(bool isKids = false);
        Task<TmdbResponseDto<TmdbMovieDto>> GetMoviesByGenreAsync(int genreId, bool isKids = false);
        Task<TmdbResponseDto<TmdbMovieDto>> DiscoverMoviesAsync(string withGenres = "", string withOriginCountry = "", string withKeywords = "", string withOriginalLanguage = "", bool isKids = false);
        Task<TmdbResponseDto<TmdbMovieDto>> DiscoverTvShowsAsync(string withGenres = "", string withOriginCountry = "", string withKeywords = "", string withOriginalLanguage = "", bool isKids = false);
        Task<TmdbResponseDto<TmdbMovieDto>> GetMovieRecommendationsAsync(int movieId, bool isKids = false);
        Task<TmdbMovieDto?> GetMovieDetailsAsync(int tmdbId);
        Task<TmdbGenreResponseDto> GetGenresAsync();
        Task<TmdbTvShowDetailsDto?> GetTvShowDetailsAsync(int tmdbId);
    }
}
