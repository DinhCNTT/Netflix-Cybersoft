import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '../../api/axiosClient';
import useAuthStore from '../../store/authStore';
import { Loader2 } from 'lucide-react';

const schema = yup.object().shape({
  fullName: yup.string().required('Vui lòng nhập họ và tên.'),
  email: yup.string().email('Vui lòng nhập địa chỉ email hợp lệ.').required('Vui lòng nhập email.'),
  password: yup.string().min(6, 'Mật khẩu của bạn phải chứa từ 6 đến 60 ký tự.').required('Vui lòng nhập mật khẩu.'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Mật khẩu nhập lại không khớp.')
    .required('Vui lòng nhập lại mật khẩu.'),
});

const Register = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await axiosClient.post('/auth/register', data);
      // Đăng ký thành công thì chuyển qua trang nhắc check email
      navigate('/check-email');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col text-white">
      <h1 className="text-3xl font-bold mb-7">Đăng Ký</h1>
      
      {errorMsg && (
        <div className="bg-[#e87c03] p-4 rounded mb-4 text-sm text-white">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            id="fullName"
            {...register('fullName')}
            className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.fullName ? 'border-b-2 border-b-[#e87c03]' : ''}`}
            placeholder=" "
          />
          <label
            htmlFor="fullName"
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
          >
            Họ và tên
          </label>
          {errors.fullName && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.fullName.message}</p>}
        </div>

        <div className="relative">
          <input
            type="text"
            id="email"
            {...register('email')}
            className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${errors.email ? 'border-b-2 border-b-[#e87c03]' : ''}`}
            placeholder=" "
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
          >
            Địa chỉ email
          </label>
          {errors.email && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.email.message}</p>}
        </div>

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

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            {...register('confirmPassword')}
            className={`peer w-full rounded border border-[#5E5E5E] bg-[#161616]/70 px-4 pt-5 pb-2 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all pr-14 ${errors.confirmPassword ? 'border-b-2 border-b-[#e87c03]' : ''}`}
            placeholder=" "
          />
          <label
            htmlFor="confirmPassword"
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[#A6A6A6] duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 cursor-text"
          >
            Nhập lại mật khẩu
          </label>
          <button 
            type="button" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-3.5 text-[#A6A6A6] hover:text-white text-sm font-medium"
          >
            {showConfirmPassword ? "Ẩn" : "Hiện"}
          </button>
          {errors.confirmPassword && <p className="text-[#e87c03] text-[13px] mt-1 px-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center rounded bg-[#E50914] py-3 text-base font-medium text-white transition hover:bg-[#C11119] disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Đăng ký'}
        </button>
      </form>

      <div className="mt-6 text-[#A6A6A6] text-base">
        <p>
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-white hover:underline font-medium">
            Đăng nhập ngay.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
