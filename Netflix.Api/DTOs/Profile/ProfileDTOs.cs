namespace Netflix.Api.DTOs.Profile
{
    public class CreateProfileRequest
    {
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public bool IsKids { get; set; } = false;
        public string? PinCode { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public bool IsKids { get; set; } = false;
        public string? PinCode { get; set; }
    }

    public class ProfileResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public bool IsKids { get; set; } = false;
        public bool HasPin { get; set; } = false;
    }

    public class VerifyPinRequest
    {
        public string PinCode { get; set; } = string.Empty;
    }
}
