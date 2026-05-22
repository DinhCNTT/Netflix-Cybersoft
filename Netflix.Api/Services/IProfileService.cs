using Netflix.Api.DTOs.Profile;

namespace Netflix.Api.Services
{
    public interface IProfileService
    {
        Task<IEnumerable<ProfileResponse>> GetProfilesAsync(Guid userId);
        Task<ProfileResponse> CreateProfileAsync(Guid userId, CreateProfileRequest request);
        Task<ProfileResponse> UpdateProfileAsync(Guid id, Guid userId, UpdateProfileRequest request);
        Task DeleteProfileAsync(Guid id, Guid userId);
        Task<bool> VerifyPinAsync(Guid id, Guid userId, string pinCode);
    }
}
