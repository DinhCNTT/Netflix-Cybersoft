using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Movie;
using Netflix.Api.Services;
using Netflix.Api.Models;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/genres")]
    [Authorize]
    public class GenresController : ControllerBase
    {
        private readonly ITmdbService _tmdbService;
        private readonly ApplicationDbContext _dbContext;

        public GenresController(ITmdbService tmdbService, ApplicationDbContext dbContext)
        {
            _tmdbService = tmdbService;
            _dbContext = dbContext;
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

        [HttpGet]
        public async Task<IActionResult> GetGenres()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);
                var isKids = profile?.IsKids ?? false;

                var tmdbRes = await _tmdbService.GetGenresAsync();
                
                var genres = tmdbRes.Genres
                    .Select(g => new GenreDto(g.Id, g.Name))
                    .ToList();

                // Lọc thể loại an toàn nếu là Profile Trẻ em
                if (isKids)
                {
                    // Trả lại các thể loại đa dạng cho Trẻ em (Hài, Phiêu lưu, Giả tượng, Khoa học viễn tưởng...)
                    // Backend (TmdbService) đã lo việc bắt buộc tất cả các phim trong này ĐỀU PHẢI LÀ phim Hoạt hình (16).
                    var safeGenreIds = new[] { 16, 10751, 35, 12, 14, 878, 10402 }; // Thêm 878 (Viễn tưởng), 10402 (Âm nhạc)
                    genres = genres.Where(g => safeGenreIds.Contains(g.Id)).ToList();
                }

                return Ok(new { status = "success", data = genres });
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
