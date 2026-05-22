import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

const CheckEmail = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white w-full max-w-md mx-auto min-h-[50vh]">
      <MailCheck className="w-20 h-20 text-[#E50914] mb-6" />
      <h1 className="text-[32px] font-bold mb-4">Kiểm tra hộp thư của bạn</h1>
      
      <p className="text-[#A6A6A6] text-base mb-8 leading-relaxed">
        Chúng tôi đã gửi một đường link xác thực đến địa chỉ email bạn vừa đăng ký. 
        Vui lòng mở hộp thư (và kiểm tra cả mục Thư rác/Spam) rồi bấm vào link để kích hoạt tài khoản.
      </p>

      <div className="w-full h-px bg-[#333] mb-8"></div>

      <p className="text-[#A6A6A6] text-sm">
        Đã xác thực thành công?{' '}
        <Link to="/login" className="text-white hover:underline font-medium">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
};

export default CheckEmail;
