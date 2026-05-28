using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Movie;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/genres")]
    [Authorize]
    public class GenresController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public GenresController(ApplicationDbContext dbContext)
        {
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

        [HttpGet]
        public async Task<IActionResult> GetGenres()
        {
            try
            {
                _ = GetUserId(); // Force auth claim check

                var genres = await _dbContext.Genres
                    .AsNoTracking()
                    .OrderBy(g => g.Name)
                    .Select(g => new GenreDto(g.Id, g.Name))
                    .ToListAsync();

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
