using Netflix.Api.Models;

namespace Netflix.Api.Repositories
{
    public interface IProfileRepository
    {
        Task<IEnumerable<Profile>> GetProfilesByUserIdAsync(Guid userId);
        Task<Profile?> GetProfileByIdAsync(Guid id, Guid userId);
        Task<int> GetProfileCountByUserIdAsync(Guid userId);
        Task<Profile> CreateProfileAsync(Profile profile);
        Task UpdateProfileAsync(Profile profile);
        Task DeleteProfileAsync(Profile profile);
    }
}
