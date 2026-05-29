using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Movie;
using Netflix.Api.DTOs.Tmdb;
using Netflix.Api.Models;
using Netflix.Api.Services;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/movies")]
    [Authorize]
    public class MovieController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public MovieController(ApplicationDbContext dbContext, ITmdbService tmdbService)
        {
            _dbContext = dbContext;
            _tmdbService = tmdbService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }
            return userId;
        }

        private async Task<Profile?> ResolveProfileAsync(Guid userId)
        {
            if (!Request.Headers.TryGetValue("X-Profile-Id", out var headerValue)) return null;
            if (!Guid.TryParse(headerValue.FirstOrDefault(), out var profileId)) return null;
            return await _dbContext.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == profileId && p.UserId == userId);
        }

        // Helper: Merge TMDB data with local database streaming URLs
        private async Task<List<MovieListItemDto>> MergeWithLocalDbAsync(IEnumerable<TmdbMovieDto> tmdbMovies)
        {
            var tmdbIds = tmdbMovies.Select(m => m.Id).ToList();
            
            // Lấy các phim có sẵn trong DB nội bộ để chèn Trailer/Video
            var localMovies = await _dbContext.Movies
                .AsNoTracking()
                .Where(m => tmdbIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id);

            var result = new List<MovieListItemDto>();
            foreach (var tmdb in tmdbMovies)
            {
                var hasLocal = localMovies.TryGetValue(tmdb.Id, out var localMovie);
                
                var posterUrl = !string.IsNullOrEmpty(tmdb.Poster_Path) ? $"https://image.tmdb.org/t/p/w500{tmdb.Poster_Path}" : null;
                var backdropUrl = !string.IsNullOrEmpty(tmdb.Backdrop_Path) ? $"https://image.tmdb.org/t/p/original{tmdb.Backdrop_Path}" : null;
                var releaseYear = 0;
                
                if (!string.IsNullOrEmpty(tmdb.Release_Date) && tmdb.Release_Date.Length >= 4)
                {
                    int.TryParse(tmdb.Release_Date.Substring(0, 4), out releaseYear);
                }
                else if (!string.IsNullOrEmpty(tmdb.First_Air_Date) && tmdb.First_Air_Date.Length >= 4)
                {
                    int.TryParse(tmdb.First_Air_Date.Substring(0, 4), out releaseYear);
                }

                // Nếu có phim nội bộ, ưu tiên link Video từ nội bộ
                var trailerUrl = hasLocal ? localMovie!.TrailerUrl : null;
                
                // Trả về nhãn độ tuổi thật để Frontend xử lý, tuy nhiên API TMDB đã lọc sẵn cho Profile Kids rồi.
                // Đặt mặc định là PG (thay vì PG-13) để Frontend không bị filter mất đối với Kids Profile.
                var maturityLevel = tmdb.Adult ? "R" : (hasLocal ? localMovie!.MaturityLevel : "PG");

                result.Add(new MovieListItemDto(
                    Id: tmdb.Id,
                    Title: tmdb.Title ?? tmdb.Name ?? "Unknown",
                    Description: tmdb.Overview,
                    PosterUrl: posterUrl,
                    BackdropUrl: backdropUrl,
                    MaturityLevel: maturityLevel,
                    ReleaseYear: releaseYear,
                    IsNetflixOriginal: false,
                    TrailerUrl: trailerUrl,
                    GenreIds: tmdb.Genre_Ids
                ));
            }
            return result;
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeatured()
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var tmdbRes = await _tmdbService.GetTrendingMoviesAsync(profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results);

                var featured = movies.OrderBy(x => Guid.NewGuid()).FirstOrDefault();
                return Ok(new { status = "success", data = featured });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var tmdbRes = await _tmdbService.GetTrendingMoviesAsync(profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("new-releases")]
        public async Task<IActionResult> GetNewReleases()
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var tmdbRes = await _tmdbService.GetNewReleasesAsync(profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("netflix-originals")]
        public async Task<IActionResult> GetNetflixOriginals()
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                // Thay vì lấy Netflix Originals thật, tạm gọi trending để có dữ liệu đa dạng
                var tmdbRes = await _tmdbService.GetTrendingMoviesAsync(profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Skip(5).Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("by-genre/{genreId:int}")]
        public async Task<IActionResult> GetByGenre(int genreId)
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var tmdbRes = await _tmdbService.GetMoviesByGenreAsync(genreId, profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetMovieById(int id)
        {
            try
            {
                var tmdbMovie = await _tmdbService.GetMovieDetailsAsync(id);
                if (tmdbMovie == null) return NotFound(new { status = "error", message = "Không tìm thấy movie." });

                var movies = await MergeWithLocalDbAsync(new[] { tmdbMovie });
                var movie = movies.FirstOrDefault();
                if (movie == null) return NotFound();

                var detail = new MovieDetailDto(
                    movie.Id, movie.Title, movie.Description, movie.PosterUrl, movie.BackdropUrl,
                    movie.MaturityLevel, movie.ReleaseYear, movie.IsNetflixOriginal, movie.TrailerUrl,
                    movie.GenreIds, new List<string>() // Thêm Genres thực tế nếu cần
                );

                return Ok(new { status = "success", data = detail });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id:int}/similar")]
        public async Task<IActionResult> GetSimilarMovies(int id)
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                // Gọi Trending làm phim tương tự cho nhanh
                var tmdbRes = await _tmdbService.GetTrendingMoviesAsync(profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Where(m => m.Id != id).Take(18));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
        [HttpGet("discover")]
        public async Task<IActionResult> Discover([FromQuery] string type = "movie", [FromQuery] string genres = "", [FromQuery] string country = "", [FromQuery] string keywords = "", [FromQuery] string language = "")
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var isKids = profile?.IsKids ?? false;
                
                TmdbResponseDto<TmdbMovieDto> tmdbRes;
                if (type.ToLower() == "tv")
                {
                    tmdbRes = await _tmdbService.DiscoverTvShowsAsync(genres, country, keywords, language, isKids);
                }
                else
                {
                    tmdbRes = await _tmdbService.DiscoverMoviesAsync(genres, country, keywords, language, isKids);
                }
                
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id:int}/recommendations")]
        public async Task<IActionResult> GetRecommendations(int id)
        {
            try
            {
                var profile = await ResolveProfileAsync(GetUserId());
                var tmdbRes = await _tmdbService.GetMovieRecommendationsAsync(id, profile?.IsKids ?? false);
                var movies = await MergeWithLocalDbAsync(tmdbRes.Results.Take(20));
                return Ok(new { status = "success", data = movies });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
