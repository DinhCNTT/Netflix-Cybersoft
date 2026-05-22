namespace Netflix.Api.DTOs.Auth
{
    public class RequestOtpDto
    {
        public required string Email { get; set; }
    }

    public class VerifyOtpDto
    {
        public required string Email { get; set; }
        public required string OtpCode { get; set; }
    }

    public class ResetPasswordDto
    {
        public required string Email { get; set; }
        public required string OtpCode { get; set; }
        public required string NewPassword { get; set; }
    }
}
