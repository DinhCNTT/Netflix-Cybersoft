import { useState, useRef, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Lock, Loader2 } from 'lucide-react';

const PinModal = ({ profile, onClose, onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs[0].current.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Chỉ cho phép nhập số
    
    setError('');
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto move to next input
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }

    // Auto submit when 4 digits are entered
    if (value && index === 3 && newPin.every(d => d !== '')) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Tự động nhảy lùi về ô trước khi bấm Backspace ở ô trống
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const verifyPin = async (pinCode) => {
    setIsLoading(true);
    try {
      await axiosClient.post(`/profile/${profile.id}/verify-pin`, { pinCode });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Mã PIN không đúng.');
      setPin(['', '', '', '']); // Xóa trắng để nhập lại
      inputRefs[0].current.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
      <div className="bg-[#141414] border border-gray-800 rounded-lg p-8 max-w-sm w-full relative animate-fade-in-up">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-[#E50914] mx-auto mb-4" />
          <h2 className="text-2xl font-medium mb-2">Nhập mã PIN</h2>
          <p className="text-gray-400 text-sm">Hồ sơ của <b>{profile.name}</b> đã được khóa. Vui lòng nhập mã PIN để truy cập.</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className={`w-14 h-16 text-center text-3xl font-bold bg-[#333] text-white border-2 rounded focus:outline-none transition ${
                error ? 'border-[#E50914]' : 'border-transparent focus:border-white'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-[#E50914] text-center text-sm mb-4 animate-shake">{error}</p>
        )}

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}} />
    </div>
  );
};

export default PinModal;
