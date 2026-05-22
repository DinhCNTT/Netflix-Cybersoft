import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/authStore';
import { CreditCard, QrCode, Loader2, Lock, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const [plan, setPlan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Visa'); // 'Visa' or 'MoMo'
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (!savedPlan) {
      navigate('/choose-plan');
    } else {
      setPlan(savedPlan);
    }
  }, [navigate]);

  const handleSubscribe = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    
    try {
      // Gọi API nạp gói (Giả lập thanh toán thành công)
      const response = await axiosClient.post('/payment/subscribe', {
        plan: plan,
        paymentMethod: paymentMethod
      });

      if (response.data?.data) {
        const { id, fullName, email, role, isSubscribed, accessToken, refreshToken } = response.data.data;
        
        // Hiện UI thành công 2 giây rồi mới chuyển trang
        setIsSuccess(true);
        setTimeout(() => {
          setAuth({ id, fullName, email, role, isSubscribed }, accessToken, refreshToken);
          localStorage.removeItem('selectedPlan');
          navigate('/browse');
        }, 2000);
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi thanh toán: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-white w-full max-w-md mx-auto min-h-[60vh]">
        <CheckCircle2 className="w-24 h-24 text-[#2ecc71] mb-6 animate-bounce" />
        <h1 className="text-[32px] font-bold mb-4">Thanh toán thành công!</h1>
        <p className="text-[#A6A6A6] text-lg mb-2">Chào mừng bạn đến với gói {plan}.</p>
        <p className="text-gray-400 text-sm">Đang chuyển hướng vào Netflix...</p>
      </div>
    );
  }

  const getPrice = () => {
    if (plan === 'Basic') return '70.000 ₫';
    if (plan === 'Standard') return '108.000 ₫';
    return '260.000 ₫';
  };

  return (
    <div className="flex flex-col text-white w-full max-w-[500px] mx-auto py-10 px-4 min-h-[80vh]">
      <h1 className="text-3xl font-bold mb-2">Thiết lập thanh toán</h1>
      <p className="text-gray-400 mb-8">Tư cách thành viên của bạn bắt đầu ngay khi bạn thiết lập thanh toán. Không có cam kết, hủy bất kỳ lúc nào.</p>

      {/* Plan Summary */}
      <div className="bg-[#1e1e1e] p-4 rounded-lg border border-gray-700 mb-8 flex justify-between items-center">
        <div>
          <p className="font-semibold text-lg">Gói {plan}</p>
          <p className="text-gray-400">{getPrice()} / tháng</p>
        </div>
        <button onClick={() => navigate('/choose-plan')} className="text-[#0071eb] font-medium hover:underline text-sm">
          Thay đổi
        </button>
      </div>

      {/* Payment Method Selector */}
      <div className="flex gap-4 mb-8">
        <button 
          type="button"
          onClick={() => setPaymentMethod('Visa')}
          className={`flex-1 flex flex-col items-center gap-2 py-4 border rounded-lg transition ${paymentMethod === 'Visa' ? 'border-white bg-[#333]' : 'border-gray-700 hover:border-gray-500'}`}
        >
          <CreditCard className="w-8 h-8" />
          <span className="font-medium text-sm">Thẻ Tín dụng / Ghi nợ</span>
        </button>
        <button 
          type="button"
          onClick={() => setPaymentMethod('MoMo')}
          className={`flex-1 flex flex-col items-center gap-2 py-4 border rounded-lg transition ${paymentMethod === 'MoMo' ? 'border-[#a50064] bg-[#a50064]/20' : 'border-gray-700 hover:border-gray-500'}`}
        >
          <QrCode className="w-8 h-8 text-[#a50064]" />
          <span className="font-medium text-sm text-[#a50064]">Ví điện tử MoMo</span>
        </button>
      </div>

      {/* Visa Form */}
      {paymentMethod === 'Visa' && (
        <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
          <div className="relative">
            <input required type="text" id="cardName" className="peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all" placeholder=" " defaultValue={user?.fullName || ''} />
            <label htmlFor="cardName" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text">Tên trên thẻ</label>
          </div>
          <div className="relative">
            <input required type="text" id="cardNumber" maxLength="19" className="peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono" placeholder=" " defaultValue="4242 4242 4242 4242" />
            <label htmlFor="cardNumber" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text">Số thẻ tín dụng</label>
            <CreditCard className="absolute right-4 top-4 text-gray-500 w-5 h-5" />
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input required type="text" id="exp" maxLength="5" className="peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono" placeholder=" " defaultValue="12/28" />
              <label htmlFor="exp" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text">Tháng/Năm (MM/YY)</label>
            </div>
            <div className="relative flex-1">
              <input required type="text" id="cvv" maxLength="3" className="peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono" placeholder=" " defaultValue="123" />
              <label htmlFor="cvv" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text">Mã bảo mật (CVV)</label>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="mt-6 flex w-full items-center justify-center rounded bg-[#E50914] py-4 text-xl font-medium text-white transition hover:bg-[#C11119] disabled:opacity-70 gap-2">
            {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Lock className="w-5 h-5" />}
            {isLoading ? 'Đang xử lý...' : 'Kích hoạt tư cách thành viên'}
          </button>
        </form>
      )}

      {/* MoMo Form */}
      {paymentMethod === 'MoMo' && (
        <div className="flex flex-col items-center bg-[#2b2b2b] border border-gray-700 rounded-xl p-8 relative overflow-hidden">
          {/* Decorative pink glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A50064] via-[#E2188C] to-[#A50064]"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="MoMo" className="w-8 h-8 rounded-lg" />
            <h2 className="text-xl font-bold">Thanh toán qua MoMo</h2>
          </div>

          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg relative group">
            {/* Real QR Code using an API */}
            <div className="relative">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ThanhToanNetflixMoMo&bgcolor=ffffff&color=000000" 
                alt="MoMo QR Code" 
                className="w-48 h-48 rounded-lg"
              />
              {/* Logo MoMo in center of QR */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-md">
                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="MoMo" className="w-8 h-8 rounded-full" />
              </div>
            </div>
            
            {/* Scanning animation line */}
            <div className="absolute top-4 left-4 right-4 h-1 bg-[#A50064] shadow-[0_0_8px_#A50064] opacity-75 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>

          <div className="text-center mb-8">
            <p className="font-semibold text-[15px] mb-1">Quét mã QR để thanh toán</p>
            <p className="text-sm text-gray-400 max-w-[250px] mx-auto leading-relaxed">
              Sử dụng Ứng dụng MoMo hoặc Ứng dụng Camera hỗ trợ QR code để quét mã.
            </p>
          </div>
          
          <button onClick={handleSubscribe} disabled={isLoading} className="flex w-full items-center justify-center rounded-lg bg-[#A50064] py-3.5 text-[17px] font-semibold text-white transition hover:bg-[#80004e] disabled:opacity-70 gap-2 shadow-[0_4px_14px_rgba(165,0,100,0.4)]">
            {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Tôi đã thanh toán trên App'}
          </button>
        </div>
      )}

      {/* Add keyframes for scan animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 16px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 208px; opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default Checkout;
