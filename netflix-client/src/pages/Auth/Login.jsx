import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/authStore';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
  email: yup.string().email('Vui lòng nhập địa chỉ email hợp lệ.').required('Vui lòng nhập email.'),
  password: yup.string().when('isOtpMode', {
    is: false,
    then: (schema) => schema.min(6, 'Mật khẩu phải từ 6 đến 60 ký tự.').required('Vui lòng nhập mật khẩu.'),
    otherwise: (schema) => schema.notRequired()
  }),
  otpCode: yup.string().when('otpSent', {
    is: true,
    then: (schema) => schema.length(6, 'Mã xác nhận gồm 6 chữ số.').required('Vui lòng nhập mã xác nhận.'),
    otherwise: (schema) => schema.notRequired()
  })
});

const Login = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    context: { isOtpMode, otpSent }
  });

  const emailValue = watch('email');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (isOtpMode) {
        if (!otpSent) {
          // Gửi yêu cầu lấy OTP
          await axiosClient.post('/auth/request-otp', { email: data.email });
          setSuccessMsg('Mã xác nhận đã được gửi đến email của bạn.');
          setOtpSent(true);
        } else {
          // Đăng nhập bằng OTP
          const response = await axiosClient.post('/auth/login-with-otp', { 
            email: data.email, 
            otpCode: data.otpCode 
          });
          if (response.data?.data) {
            const { id, fullName, email, role, isSubscribed, accessToken, refreshToken } = response.data.data;
            setAuth({ id, fullName, email, role, isSubscribed }, accessToken, refreshToken);
            navigate('/browse');
          }
        }
      } else {
        // Đăng nhập bằng Password truyền thống
        const response = await axiosClient.post('/auth/login', data);
        if (response.data?.data) {
          const { id, fullName, email, role, isSubscribed, accessToken, refreshToken } = response.data.data;
          setAuth({ id, fullName, email, role, isSubscribed }, accessToken, refreshToken);
          navigate('/browse');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col text-white w-full max-w-[314px] mx-auto">
      <h1 className="text-[32px] font-bold mb-7">Đăng nhập</h1>
      
      {errorMsg && (
        <div className="bg-[#e87c03] p-4 rounded mb-4 text-sm text-white">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-[#2ecc71] p-4 rounded mb-4 text-sm text-white">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            id="email"
            readOnly={otpSent}
            {...register('email')}
            className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.email ? 'border-b-2 border-b-[#e87c03]' : ''} ${otpSent ? 'opacity-70' : ''}`}
            placeholder=" "
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
          >
            Email
          </label>
          {errors.email && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.email.message}</p>}
        </div>

        {!isOtpMode && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              {...register('password')}
              className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all pr-14 ${errors.password ? 'border-b-2 border-b-[#e87c03]' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
            >
              Mật khẩu
            </label>
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-[#A6A6A6] hover:text-white text-sm font-medium"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
            {errors.password && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.password.message}</p>}
          </div>
        )}

        {isOtpMode && otpSent && (
          <div className="relative">
            <input
              type="text"
              id="otpCode"
              maxLength={6}
              {...register('otpCode')}
              className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.otpCode ? 'border-b-2 border-b-[#e87c03]' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="otpCode"
              className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
            >
              Mã xác nhận (6 số)
            </label>
            {errors.otpCode && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.otpCode.message}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center rounded bg-[#E50914] py-3 text-base font-medium text-white transition hover:bg-[#C11119] disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isOtpMode ? (otpSent ? 'Đăng nhập' : 'Gửi mã đăng nhập') : 'Đăng nhập')}
        </button>
        
        <div className="text-center text-[#A6A6A6] text-[16px] my-1">
          HOẶC
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOtpMode(!isOtpMode);
            setOtpSent(false);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="flex w-full items-center justify-center rounded bg-[#333333]/80 hover:bg-[#333333] py-3 text-base font-medium text-white transition"
        >
          {isOtpMode ? 'Sử dụng mật khẩu' : 'Sử dụng mã đăng nhập'}
        </button>
        
        <div className="text-center mt-3">
          <Link to="/forgot-password" className="text-white hover:underline hover:text-[#A6A6A6] text-base transition">
            Bạn quên mật khẩu?
          </Link>
        </div>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <input 
          type="checkbox" 
          id="remember" 
          className="w-[18px] h-[18px] rounded-sm border-gray-500 bg-transparent text-white focus:ring-0 cursor-pointer accent-white"
          defaultChecked
        />
        <label htmlFor="remember" className="text-white text-base cursor-pointer">Ghi nhớ tôi</label>
      </div>

      <div className="mt-4 text-[#A6A6A6] text-base">
        <p>
          Mới tham gia Netflix?{' '}
          <Link to="/register" className="text-white hover:underline font-medium">
            Đăng ký ngay.
          </Link>
        </p>
        <p className="mt-3 text-[13px] text-[#8c8c8c] leading-snug">
          Trang này được Google reCAPTCHA bảo vệ để đảm bảo bạn không phải là bot.{' '}
          <button className="text-[#0071eb] hover:underline">Tìm hiểu thêm.</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
