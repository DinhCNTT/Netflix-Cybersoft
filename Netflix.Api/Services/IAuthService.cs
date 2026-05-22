using Netflix.Api.DTOs.Auth;

namespace Netflix.Api.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(Guid userId);
        Task<bool> VerifyEmailAsync(string token);
        Task<AuthResponse> SubscribeAsync(Guid userId, string plan, string paymentMethod);
        
        // OTP & Reset Password
        Task RequestOtpAsync(string email);
        Task<bool> VerifyOtpAsync(string email, string otp);
        Task ResetPasswordAsync(string email, string otp, string newPassword);
        Task<AuthResponse> LoginWithOtpAsync(string email, string otp);
    }
}
