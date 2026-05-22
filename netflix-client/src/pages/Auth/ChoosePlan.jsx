import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const ChoosePlan = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (planName) => {
    // Lưu gói cước được chọn vào localStorage để mang sang trang Checkout
    localStorage.setItem('selectedPlan', planName);
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col items-center justify-center text-white w-full max-w-[1000px] mx-auto py-10 px-4 min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-[32px] font-bold mb-4">Chọn gói dịch vụ phù hợp với bạn</h1>
        <ul className="text-left text-lg mx-auto max-w-sm mb-6 space-y-3">
          <li className="flex items-center gap-2"><Check className="text-[#E50914] w-6 h-6 shrink-0" /> Không quảng cáo. Bỏ qua mọi rào cản.</li>
          <li className="flex items-center gap-2"><Check className="text-[#E50914] w-6 h-6 shrink-0" /> Phim hay đề xuất riêng cho bạn.</li>
          <li className="flex items-center gap-2"><Check className="text-[#E50914] w-6 h-6 shrink-0" /> Hủy đổi gói bất kỳ lúc nào.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Basic Plan */}
        <div className="flex flex-col border border-gray-600 rounded-xl p-6 hover:border-white cursor-pointer transition relative group" onClick={() => handleSelectPlan('Basic')}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e3264]/20 to-transparent rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition"></div>
          <h2 className="text-xl font-semibold mb-2">Cơ bản</h2>
          <p className="text-gray-400 text-sm mb-4">70.000 ₫/tháng</p>
          <div className="h-px bg-gray-600 w-full mb-4"></div>
          <ul className="space-y-4 text-sm flex-1">
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Chất lượng video</span>
              <span className="font-medium">Tốt</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Độ phân giải</span>
              <span className="font-medium">720p (HD)</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Thiết bị hỗ trợ</span>
              <span className="font-medium text-right">TV, máy tính, ĐTDĐ, máy tính bảng</span>
            </li>
          </ul>
          <button className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-medium transition">
            Chọn gói này
          </button>
        </div>

        {/* Standard Plan */}
        <div className="flex flex-col border border-[#E50914] rounded-xl p-6 hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer transition relative group transform md:-translate-y-4" onClick={() => handleSelectPlan('Standard')}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#E50914]/10 to-transparent rounded-xl pointer-events-none"></div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E50914] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Phổ biến nhất</div>
          <h2 className="text-xl font-semibold mb-2">Tiêu chuẩn</h2>
          <p className="text-gray-400 text-sm mb-4">108.000 ₫/tháng</p>
          <div className="h-px bg-gray-600 w-full mb-4"></div>
          <ul className="space-y-4 text-sm flex-1">
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Chất lượng video</span>
              <span className="font-medium">Tuyệt vời</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Độ phân giải</span>
              <span className="font-medium">1080p (Full HD)</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Thiết bị hỗ trợ</span>
              <span className="font-medium text-right">TV, máy tính, ĐTDĐ, máy tính bảng</span>
            </li>
          </ul>
          <button className="mt-6 w-full bg-[#E50914] hover:bg-[#C11119] text-white py-3 rounded font-medium transition">
            Chọn gói này
          </button>
        </div>

        {/* Premium Plan */}
        <div className="flex flex-col border border-gray-600 rounded-xl p-6 hover:border-white cursor-pointer transition relative group" onClick={() => handleSelectPlan('Premium')}>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition"></div>
          <h2 className="text-xl font-semibold mb-2">Cao cấp</h2>
          <p className="text-gray-400 text-sm mb-4">260.000 ₫/tháng</p>
          <div className="h-px bg-gray-600 w-full mb-4"></div>
          <ul className="space-y-4 text-sm flex-1">
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Chất lượng video</span>
              <span className="font-medium">Hoàn hảo nhất</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Độ phân giải</span>
              <span className="font-medium">4K (Ultra HD) + HDR</span>
            </li>
            <li className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Thiết bị hỗ trợ</span>
              <span className="font-medium text-right">TV, máy tính, ĐTDĐ, máy tính bảng</span>
            </li>
          </ul>
          <button className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-medium transition">
            Chọn gói này
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChoosePlan;
