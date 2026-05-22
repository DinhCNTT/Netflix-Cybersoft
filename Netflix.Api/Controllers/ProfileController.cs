using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Netflix.Api.DTOs.Profile;
using Netflix.Api.Services;
using System.Security.Claims;

namespace Netflix.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                throw new Exception("Unauthorized");
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfiles()
        {
            try
            {
                var profiles = await _profileService.GetProfilesAsync(GetUserId());
                return Ok(new { status = "success", data = profiles });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProfile([FromBody] CreateProfileRequest request)
        {
            try
            {
                var profile = await _profileService.CreateProfileAsync(GetUserId(), request);
                return Ok(new { status = "success", message = "Tạo hồ sơ thành công.", data = profile });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateProfileRequest request)
        {
            try
            {
                var profile = await _profileService.UpdateProfileAsync(id, GetUserId(), request);
                return Ok(new { status = "success", message = "Cập nhật hồ sơ thành công.", data = profile });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProfile(Guid id)
        {
            try
            {
                await _profileService.DeleteProfileAsync(id, GetUserId());
                return Ok(new { status = "success", message = "Xóa hồ sơ thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPost("{id}/verify-pin")]
        public async Task<IActionResult> VerifyPin(Guid id, [FromBody] VerifyPinRequest request)
        {
            try
            {
                var isValid = await _profileService.VerifyPinAsync(id, GetUserId(), request.PinCode);
                if (!isValid)
                    return BadRequest(new { status = "error", message = "Mã PIN không chính xác." });

                return Ok(new { status = "success", message = "Xác thực mã PIN thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
