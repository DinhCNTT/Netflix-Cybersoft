import { useState, useRef, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Loader2 } from 'lucide-react';

const PinModal = ({ profile, onClose, onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Chỉ lấy ký tự cuối cùng nếu người dùng nhập nhanh hoặc dán
    const cleanValue = value.slice(-1);
    if (!/^\d*$/.test(cleanValue)) return; // Chỉ cho phép nhập số
    
    setError('');
    const newPin = [...pin];
    newPin[index] = cleanValue;
    setPin(newPin);

    // Tự động chuyển sang ô tiếp theo
    if (cleanValue && index < 3) {
      inputRefs[index + 1].current.focus();
    }

    // Tự động gửi khi đã nhập đủ 4 số
    if (cleanValue && index === 3 && newPin.every(d => d !== '')) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setError('');
      
      const newPin = [...pin];
      
      if (pin[index]) {
        // Nếu ô hiện tại có chữ, xóa chữ ở ô hiện tại
        newPin[index] = '';
        setPin(newPin);
      } else if (index > 0) {
        // Nếu ô hiện tại rỗng, xóa chữ ở ô trước và focus về ô trước
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs[index - 1].current.focus();
      }
    }
  };

  const verifyPin = async (pinCode) => {
    setIsLoading(true);
    try {
      await axiosClient.post(`/profile/${profile.id}/verify-pin`, { pinCode });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Mã PIN không chính xác. Vui lòng thử lại.');
      setPin(['', '', '', '']); // Xóa trắng để nhập lại
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-white">
      {/* Nút Đóng (X) ở góc trên bên phải */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-400 hover:text-white transition duration-200 focus:outline-none"
        aria-label="Close"
      >
        <X className="w-10 h-10 stroke-[1.5]" />
      </button>

      <div className="flex flex-col items-center max-w-2xl w-full px-6 animate-fade-in-up">
        {/* Tiêu đề phụ */}
        <p className="text-gray-400 text-sm md:text-base font-light tracking-wide mb-3">
          Khóa hồ sơ hiện đang bật.
        </p>

        {/* Tiêu đề chính */}
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-center tracking-tight leading-tight mb-12">
          Nhập mã PIN để truy cập hồ sơ này.
        </h2>

        {/* Các ô nhập PIN */}
        <div className="flex justify-center gap-3 md:gap-5 mb-8">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className={`w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-light bg-transparent text-white border transition-all duration-300 focus:outline-none ${
                error 
                  ? 'border-[#E50914]' 
                  : 'border-gray-600 focus:border-white focus:ring-1 focus:ring-white'
              }`}
              style={{
                WebkitTextSecurity: 'disc', // Chuyển chữ thành chấm tròn mật khẩu bảo mật
              }}
            />
          ))}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="h-6 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Lỗi */}
        {error && (
          <p className="text-[#E50914] text-center text-sm md:text-base font-medium mb-6 animate-shake">
            {error}
          </p>
        )}

        {/* Quên mã PIN */}
        <button 
          className="text-gray-500 hover:underline hover:text-gray-400 transition text-sm md:text-base mt-8 focus:outline-none"
          onClick={() => alert('Vui lòng liên hệ chủ tài khoản để đặt lại mã PIN trong phần quản lý tài khoản.')}
        >
          Bạn quên mã PIN?
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 0s 2;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default PinModal;
