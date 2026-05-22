import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Đang xác thực email của bạn...');
  
  // Tránh useEffect chạy 2 lần trong StrictMode
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus('error');
        setMessage('Đường link xác thực không hợp lệ hoặc bị thiếu.');
        return;
      }

      try {
        const response = await axiosClient.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Xác thực email thành công!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Có lỗi xảy ra khi xác thực email.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-white w-full max-w-md mx-auto min-h-[50vh]">
      {status === 'loading' && (
        <>
          <Loader2 className="w-20 h-20 text-[#E50914] mb-6 animate-spin" />
          <h1 className="text-[32px] font-bold mb-4">Đang xác thực...</h1>
          <p className="text-[#A6A6A6] text-base">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-20 h-20 text-[#2ecc71] mb-6" />
          <h1 className="text-[32px] font-bold mb-4">Xác thực thành công!</h1>
          <p className="text-[#A6A6A6] text-base mb-8 leading-relaxed">
            {message} Bạn đã có thể đăng nhập để tiếp tục.
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded bg-[#E50914] py-3 text-base font-medium text-white transition hover:bg-[#C11119]"
          >
            Đăng nhập ngay
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-20 h-20 text-[#E50914] mb-6" />
          <h1 className="text-[32px] font-bold mb-4">Xác thực thất bại</h1>
          <p className="text-[#A6A6A6] text-base mb-8 leading-relaxed">
            {message}
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded bg-[#333] hover:bg-[#454545] py-3 text-base font-medium text-white transition"
          >
            Quay lại trang đăng nhập
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
