namespace Netflix.Api.DTOs.Payment
{
    public class SubscribeRequest
    {
        public string Plan { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty; // Visa or MoMo
    }
}
