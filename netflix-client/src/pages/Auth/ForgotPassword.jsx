import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '../../api/axiosClient';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
  email: yup.string().email('Vui lòng nhập địa chỉ email hợp lệ.').required('Vui lòng nhập email.'),
  otpCode: yup.string().when('step', {
    is: (val) => val >= 2,
    then: (schema) => schema.length(6, 'Mã xác nhận gồm 6 chữ số.').required('Vui lòng nhập mã xác nhận.'),
    otherwise: (schema) => schema.notRequired()
  }),
  newPassword: yup.string().when('step', {
    is: 3,
    then: (schema) => schema.min(6, 'Mật khẩu phải từ 6 đến 60 ký tự.').required('Vui lòng nhập mật khẩu mới.'),
    otherwise: (schema) => schema.notRequired()
  })
});

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    context: { step }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (step === 1) {
        // Gửi OTP
        await axiosClient.post('/auth/request-otp', { email: data.email });
        setSuccessMsg('Mã xác nhận đã được gửi đến email của bạn.');
        setStep(2);
      } else if (step === 2) {
        // Xác thực OTP
        await axiosClient.post('/auth/verify-otp', { email: data.email, otpCode: data.otpCode });
        setSuccessMsg('Mã xác nhận hợp lệ. Vui lòng nhập mật khẩu mới.');
        setStep(3);
      } else if (step === 3) {
        // Đặt lại mật khẩu
        await axiosClient.post('/auth/reset-password', { 
          email: data.email, 
          otpCode: data.otpCode,
          newPassword: data.newPassword
        });
        setSuccessMsg('Đặt lại mật khẩu thành công! Chuyển hướng tới trang đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col text-white w-full max-w-[314px] mx-auto">
      <h1 className="text-[32px] font-bold mb-7">Quên mật khẩu</h1>
      
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
            readOnly={step > 1}
            {...register('email')}
            className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.email ? 'border-b-2 border-b-[#e87c03]' : ''} ${step > 1 ? 'opacity-70' : ''}`}
            placeholder=" "
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
          >
            Email đã đăng ký
          </label>
          {errors.email && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.email.message}</p>}
        </div>

        {step >= 2 && (
          <div className="relative">
            <input
              type="text"
              id="otpCode"
              maxLength={6}
              readOnly={step > 2}
              {...register('otpCode')}
              className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.otpCode ? 'border-b-2 border-b-[#e87c03]' : ''} ${step > 2 ? 'opacity-70' : ''}`}
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

        {step === 3 && (
          <div className="relative">
            <input
              type="password"
              id="newPassword"
              {...register('newPassword')}
              className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.newPassword ? 'border-b-2 border-b-[#e87c03]' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="newPassword"
              className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
            >
              Mật khẩu mới
            </label>
            {errors.newPassword && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.newPassword.message}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center rounded bg-[#E50914] py-3 text-base font-medium text-white transition hover:bg-[#C11119] disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
            step === 1 ? 'Gửi mã khôi phục' :
            step === 2 ? 'Xác nhận mã' : 'Đặt lại mật khẩu'
          )}
        </button>
      </form>

      <div className="mt-4 text-[#A6A6A6] text-base">
        <p>
          Bạn đã nhớ lại mật khẩu?{' '}
          <Link to="/login" className="text-white hover:underline font-medium">
            Đăng nhập ngay.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
