using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Netflix.Api.DTOs.Auth;
using Netflix.Api.Models;
using Netflix.Api.Repositories;
using BCrypt.Net;

namespace Netflix.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(IAuthRepository authRepository, IConfiguration configuration, IEmailService emailService)
        {
            _authRepository = authRepository;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _authRepository.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
                throw new Exception("Email đã được sử dụng.");

            var verificationToken = Guid.NewGuid().ToString("N");

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "User",
                IsEmailVerified = false,
                VerificationToken = verificationToken,
                IsSubscribed = false
            };

            await _authRepository.CreateUserAsync(user);

            var verificationLink = $"http://localhost:5173/verify-email?token={verificationToken}";
            
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f3f3;'>
                    <div style='background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;'>
                        <h1 style='color: #E50914; margin-bottom: 20px; font-size: 28px;'>Netflix Clone</h1>
                        <h2 style='color: #333; margin-bottom: 20px;'>Xác thực tài khoản của bạn</h2>
                        <p style='color: #666; font-size: 16px; margin-bottom: 30px;'>Cảm ơn bạn đã tham gia! Hãy nhấn vào nút bên dưới để xác thực địa chỉ email của bạn và hoàn tất quá trình đăng ký.</p>
                        <a href='{verificationLink}' style='background-color: #E50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;'>Xác nhận Email</a>
                        <p style='color: #999; font-size: 14px; mt-4'>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>
                    </div>
                </div>";

            await _emailService.SendEmailAsync(user.Email, "Netflix Clone - Xác nhận địa chỉ Email", body);

            // Bỏ trả về Token, bắt người dùng phải kiểm tra email
            return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, user.IsSubscribed, "PENDING_VERIFICATION", "");
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _authRepository.GetUserByEmailAsync(request.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new Exception("Email hoặc mật khẩu không chính xác.");

            if (!user.IsActive)
                throw new Exception("Tài khoản đã bị vô hiệu hóa.");

            if (!user.IsEmailVerified)
                throw new Exception("Vui lòng kiểm tra email và bấm vào link xác thực trước khi đăng nhập.");

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, user.IsSubscribed, token, refreshToken);
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var user = await _authRepository.GetUserByRefreshTokenAsync(refreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new Exception("Invalid or expired refresh token");

            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, user.IsSubscribed, newAccessToken, newRefreshToken);
        }

        public async Task LogoutAsync(Guid userId)
        {
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _authRepository.UpdateUserAsync(user);
            }
        }

        public async Task<bool> VerifyEmailAsync(string token)
        {
            var user = await _authRepository.GetUserByVerificationTokenAsync(token);
            if (user == null)
                throw new Exception("Link xác thực không hợp lệ hoặc đã hết hạn.");

            if (user.IsEmailVerified)
                throw new Exception("Tài khoản này đã được xác thực trước đó.");

            user.IsEmailVerified = true;
            user.VerificationToken = null; // Clear token sau khi dùng
            
            await _authRepository.UpdateUserAsync(user);
            
            return true;
        }

        public async Task<AuthResponse> SubscribeAsync(Guid userId, string plan, string paymentMethod)
        {
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");

            user.IsSubscribed = true;
            user.SubscriptionPlan = plan;
            user.PaymentMethod = paymentMethod;

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, user.IsSubscribed, token, refreshToken);
        }

        public async Task RequestOtpAsync(string email)
        {
            var user = await _authRepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new Exception("Không tìm thấy tài khoản với email này.");

            var otp = new Random().Next(100000, 999999).ToString();
            user.OtpCode = otp;
            user.OtpExpiryTime = DateTime.UtcNow.AddMinutes(5);
            
            await _authRepository.UpdateUserAsync(user);

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f3f3;'>
                    <div style='background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;'>
                        <h1 style='color: #E50914; margin-bottom: 20px; font-size: 28px;'>Netflix Clone</h1>
                        <h2 style='color: #333; margin-bottom: 20px;'>Mã xác nhận của bạn</h2>
                        <p style='color: #666; font-size: 16px; margin-bottom: 30px;'>Bạn (hoặc ai đó) vừa yêu cầu mã xác nhận để đăng nhập hoặc đặt lại mật khẩu. Vui lòng sử dụng mã gồm 6 chữ số dưới đây:</p>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;'>
                            <h1 style='font-size: 40px; letter-spacing: 5px; color: #333; margin: 0;'>{otp}</h1>
                        </div>
                        <p style='color: #999; font-size: 14px;'>Mã này sẽ hết hạn sau 5 phút.</p>
                        <p style='color: #999; font-size: 14px;'>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                    </div>
                </div>";

            await _emailService.SendEmailAsync(user.Email, "Netflix Clone - Mã xác nhận của bạn", body);
        }

        public async Task<bool> VerifyOtpAsync(string email, string otp)
        {
            var user = await _authRepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new Exception("Không tìm thấy tài khoản.");

            if (user.OtpCode != otp || user.OtpExpiryTime == null || user.OtpExpiryTime < DateTime.UtcNow)
                return false;

            return true;
        }

        public async Task ResetPasswordAsync(string email, string otp, string newPassword)
        {
            var isValid = await VerifyOtpAsync(email, otp);
            if (!isValid)
                throw new Exception("Mã OTP không hợp lệ hoặc đã hết hạn.");

            var user = await _authRepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new Exception("Không tìm thấy tài khoản.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.OtpCode = null;
            user.OtpExpiryTime = null;
            
            await _authRepository.UpdateUserAsync(user);
        }

        public async Task<AuthResponse> LoginWithOtpAsync(string email, string otp)
        {
            var isValid = await VerifyOtpAsync(email, otp);
            if (!isValid)
                throw new Exception("Mã OTP không hợp lệ hoặc đã hết hạn.");

            var user = await _authRepository.GetUserByEmailAsync(email);
            if (user == null)
                throw new Exception("Không tìm thấy tài khoản.");

            if (!user.IsActive)
                throw new Exception("Tài khoản đã bị vô hiệu hóa.");

            // Đánh dấu là email đã verify (nếu chưa)
            user.IsEmailVerified = true;
            user.OtpCode = null;
            user.OtpExpiryTime = null;

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse(user.Id, user.FullName, user.Email, user.Role, user.IsSubscribed, token, refreshToken);
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt Key is missing")));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("FullName", user.FullName),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("IsSubscribed", user.IsSubscribed.ToString().ToLower()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
