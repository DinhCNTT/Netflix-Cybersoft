using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Episode;
using Netflix.Api.Services;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/movies")]
    [Authorize]
    public class EpisodeController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public EpisodeController(ApplicationDbContext dbContext, ITmdbService tmdbService)
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

        [HttpGet("{id:int}/seasons")]
        public async Task<IActionResult> GetSeasonsByMovie(int id)
        {
            try
            {
                var userId = GetUserId();
                var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

                if (user is null)
                {
                    return Unauthorized(new { status = "error", message = "Unauthorized" });
                }

                if (!user.IsSubscribed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden,
                        new { status = "error", message = "Bạn cần gói subscription hợp lệ để xem video." });
                }

                var movie = await _dbContext.Movies.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
                var seasons = new List<SeasonDto>();
                var mockHlsUrl = "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8"; // Cinematic 1080p HLS with Audio

                if (movie != null)
                {
                    seasons = await _dbContext.Seasons
                        .AsNoTracking()
                        .Where(s => s.MovieId == id)
                        .OrderBy(s => s.SeasonNumber)
                    .Select(s => new SeasonDto(
                        s.Id,
                        s.SeasonNumber,
                        s.Title,
                        s.Episodes
                            .OrderBy(e => e.EpisodeNumber)
                            .Select(e => new EpisodeDto(
                                e.Id,
                                e.EpisodeNumber,
                                e.Title,
                                mockHlsUrl, // Override local DB URL to ensure all movies play the new cinematic stream
                                e.DurationMinutes,
                                e.SubtitleUrl
                            ))
                            .ToList()
                    ))
                    .ToListAsync();
                }

                // Dynamic TMDB Mocking
                if (!seasons.Any())
                {
                    var tvDetails = await _tmdbService.GetTvShowDetailsAsync(id);
                    
                    if (tvDetails != null && tvDetails.Seasons != null && tvDetails.Seasons.Any())
                    {
                        int fakeEpId = id * 1000;
                        foreach(var tmdbSeason in tvDetails.Seasons.Where(s => s.Season_Number > 0).Take(5))
                        {
                            var mockEpisodes = new List<EpisodeDto>();
                            int epCount = tmdbSeason.Episode_Count > 0 ? tmdbSeason.Episode_Count : 10;
                            for(int i = 1; i <= epCount; i++)
                            {
                                mockEpisodes.Add(new EpisodeDto(
                                    fakeEpId++, 
                                    i, 
                                    $"Tập {i}", 
                                    mockHlsUrl, 
                                    45, 
                                    ""
                                ));
                            }
                            seasons.Add(new SeasonDto(
                                tmdbSeason.Id, 
                                tmdbSeason.Season_Number, 
                                string.IsNullOrEmpty(tmdbSeason.Name) ? $"Mùa {tmdbSeason.Season_Number}" : tmdbSeason.Name,
                                mockEpisodes
                            ));
                        }
                    }

                    if (!seasons.Any())
                    {
                        // Fetch movie details to get the actual title from TMDB
                        var movieDetails = await _tmdbService.GetMovieDetailsAsync(id);
                        var title = movieDetails?.Title ?? "Movie";

                        var mockEpisodes = new List<EpisodeDto>
                        {
                            new EpisodeDto(
                                id, 
                                1, 
                                "Full Movie", 
                                mockHlsUrl, 
                                120, 
                                ""
                            )
                        };
                        seasons.Add(new SeasonDto(
                            id, 
                            1, 
                            title, 
                            mockEpisodes
                        ));
                    }
                }

                // If movie is null (not in local DB), fetch from TMDB to get title for the response
                string responseTitle = movie?.Title ?? "Phim";
                if (movie == null) {
                     var movieDetails = await _tmdbService.GetMovieDetailsAsync(id);
                     if (movieDetails != null) responseTitle = movieDetails.Title ?? movieDetails.Name ?? "Phim";
                }

                return Ok(new
                {
                    status = "success",
                    data = new
                    {
                        movieId = movie?.Id ?? id,
                        movieTitle = responseTitle,
                        seasons
                    }
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
