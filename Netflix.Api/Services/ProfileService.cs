using Netflix.Api.DTOs.Profile;
using Netflix.Api.Models;
using Netflix.Api.Repositories;

namespace Netflix.Api.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IProfileRepository _profileRepository;

        public ProfileService(IProfileRepository profileRepository)
        {
            _profileRepository = profileRepository;
        }

        public async Task<IEnumerable<ProfileResponse>> GetProfilesAsync(Guid userId)
        {
            var profiles = await _profileRepository.GetProfilesByUserIdAsync(userId);
            return profiles.Select(p => new ProfileResponse
            {
                Id = p.Id,
                Name = p.Name,
                AvatarUrl = p.AvatarUrl,
                IsKids = p.IsKids,
                HasPin = !string.IsNullOrEmpty(p.PinCode)
            });
        }

        public async Task<ProfileResponse> CreateProfileAsync(Guid userId, CreateProfileRequest request)
        {
            var count = await _profileRepository.GetProfileCountByUserIdAsync(userId);
            if (count >= 5)
                throw new Exception("Bạn chỉ có thể tạo tối đa 5 hồ sơ.");

            var profile = new Profile
            {
                UserId = userId,
                Name = request.Name,
                AvatarUrl = string.IsNullOrEmpty(request.AvatarUrl) ? "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/1.png" : request.AvatarUrl,
                IsKids = request.IsKids,
                PinCode = request.PinCode
            };

            var createdProfile = await _profileRepository.CreateProfileAsync(profile);

            return new ProfileResponse
            {
                Id = createdProfile.Id,
                Name = createdProfile.Name,
                AvatarUrl = createdProfile.AvatarUrl,
                IsKids = createdProfile.IsKids,
                HasPin = !string.IsNullOrEmpty(createdProfile.PinCode)
            };
        }

        public async Task<ProfileResponse> UpdateProfileAsync(Guid id, Guid userId, UpdateProfileRequest request)
        {
            var profile = await _profileRepository.GetProfileByIdAsync(id, userId);
            if (profile == null)
                throw new Exception("Hồ sơ không tồn tại.");

            profile.Name = request.Name;
            if (!string.IsNullOrEmpty(request.AvatarUrl))
                profile.AvatarUrl = request.AvatarUrl;
            
            profile.IsKids = request.IsKids;
            profile.PinCode = request.PinCode;

            await _profileRepository.UpdateProfileAsync(profile);

            return new ProfileResponse
            {
                Id = profile.Id,
                Name = profile.Name,
                AvatarUrl = profile.AvatarUrl,
                IsKids = profile.IsKids,
                HasPin = !string.IsNullOrEmpty(profile.PinCode)
            };
        }

        public async Task DeleteProfileAsync(Guid id, Guid userId)
        {
            var profile = await _profileRepository.GetProfileByIdAsync(id, userId);
            if (profile == null)
                throw new Exception("Hồ sơ không tồn tại.");

            await _profileRepository.DeleteProfileAsync(profile);
        }

        public async Task<bool> VerifyPinAsync(Guid id, Guid userId, string pinCode)
        {
            var profile = await _profileRepository.GetProfileByIdAsync(id, userId);
            if (profile == null)
                throw new Exception("Hồ sơ không tồn tại.");

            if (string.IsNullOrEmpty(profile.PinCode))
                return true;

            return profile.PinCode == pinCode;
        }
    }
}
