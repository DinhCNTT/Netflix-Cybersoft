using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.Models;

namespace Netflix.Api.Repositories
{
    public class ProfileRepository : IProfileRepository
    {
        private readonly ApplicationDbContext _context;

        public ProfileRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Profile>> GetProfilesByUserIdAsync(Guid userId)
        {
            return await _context.Profiles
                .Where(p => p.UserId == userId)
                .OrderBy(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Profile?> GetProfileByIdAsync(Guid id, Guid userId)
        {
            return await _context.Profiles
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        }

        public async Task<int> GetProfileCountByUserIdAsync(Guid userId)
        {
            return await _context.Profiles.CountAsync(p => p.UserId == userId);
        }

        public async Task<Profile> CreateProfileAsync(Profile profile)
        {
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();
            return profile;
        }

        public async Task UpdateProfileAsync(Profile profile)
        {
            _context.Profiles.Update(profile);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteProfileAsync(Profile profile)
        {
            _context.Profiles.Remove(profile);
            await _context.SaveChangesAsync();
        }
    }
}
