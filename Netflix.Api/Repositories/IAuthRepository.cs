using Netflix.Api.Models;

namespace Netflix.Api.Repositories
{
    public interface IAuthRepository
    {
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByIdAsync(Guid id);
        Task<User?> GetUserByRefreshTokenAsync(string refreshToken);
        Task<User?> GetUserByVerificationTokenAsync(string token);
        Task<User> CreateUserAsync(User user);
        Task UpdateUserAsync(User user);
    }
}
