using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Netflix.Api.Services;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/devices")]
    [Authorize]
    public class DeviceController : ControllerBase
    {
        private readonly IActiveSessionService _sessionService;

        public DeviceController(IActiveSessionService sessionService)
        {
            _sessionService = sessionService;
        }

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
                throw new UnauthorizedAccessException("Unauthorized");
            return id;
        }

        private Guid? GetCurrentSessionId()
        {
            if (Request.Headers.TryGetValue("X-Session-Id", out var val)
                && Guid.TryParse(val.FirstOrDefault(), out var sessionId))
                return sessionId;
            return null;
        }

        /// <summary>GET /api/devices — Danh sách thiết bị đang đăng nhập</summary>
        [HttpGet]
        public async Task<IActionResult> GetDevices()
        {
            try
            {
                var userId = GetUserId();
                var currentSessionId = GetCurrentSessionId();
                var sessions = await _sessionService.GetByUserAsync(userId);

                var result = sessions.Select(s => new
                {
                    s.Id,
                    s.DeviceName,
                    s.DeviceType,
                    s.IpAddress,
                    s.CreatedAt,
                    s.LastSeenAt,
                    IsCurrent = currentSessionId.HasValue && s.Id == currentSessionId.Value
                });

                return Ok(new { status = "success", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>DELETE /api/devices/{sessionId} — Đăng xuất một thiết bị cụ thể</summary>
        [HttpDelete("{sessionId:guid}")]
        public async Task<IActionResult> RevokeDevice(Guid sessionId)
        {
            try
            {
                var userId = GetUserId();
                var sessions = await _sessionService.GetByUserAsync(userId);

                // Chỉ cho phép xóa session thuộc về user hiện tại
                if (!sessions.Any(s => s.Id == sessionId))
                    return NotFound(new { status = "error", message = "Không tìm thấy phiên đăng nhập." });

                await _sessionService.RemoveAsync(sessionId);
                return Ok(new { status = "success", message = "Đã đăng xuất thiết bị." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>DELETE /api/devices/others — Đăng xuất tất cả thiết bị khác</summary>
        [HttpDelete("others")]
        public async Task<IActionResult> RevokeOtherDevices()
        {
            try
            {
                var userId = GetUserId();
                var currentSessionId = GetCurrentSessionId();
                await _sessionService.RemoveAllForUserAsync(userId, currentSessionId);
                return Ok(new { status = "success", message = "Đã đăng xuất tất cả thiết bị khác." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        /// <summary>DELETE /api/devices/all — Đăng xuất tất cả thiết bị (kể cả thiết bị hiện tại)</summary>
        [HttpDelete("all")]
        public async Task<IActionResult> RevokeAllDevices()
        {
            try
            {
                var userId = GetUserId();
                await _sessionService.RemoveAllForUserAsync(userId);
                return Ok(new { status = "success", message = "Đã đăng xuất tất cả thiết bị." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
