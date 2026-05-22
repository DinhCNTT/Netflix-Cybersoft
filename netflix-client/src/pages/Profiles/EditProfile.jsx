import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Loader2, ArrowLeft } from 'lucide-react';

const defaultAvatars = [
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/1.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/2.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/3.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/4.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/5.png"
];

const EditProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // Dữ liệu profile truyền từ trang ManageProfiles qua thẻ <Link state={{profile}}>
  const initialProfile = location.state?.profile || {
    name: '',
    avatarUrl: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
    isKids: false,
    pinCode: ''
  };

  const [formData, setFormData] = useState({
    name: initialProfile.name,
    avatarUrl: initialProfile.avatarUrl,
    isKids: initialProfile.isKids,
    pinCode: initialProfile.pinCode || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên hồ sơ.');
      return;
    }

    if (formData.pinCode && formData.pinCode.length !== 4) {
      setError('Mã PIN phải bao gồm đúng 4 chữ số.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        avatarUrl: formData.avatarUrl,
        isKids: formData.isKids,
        pinCode: formData.pinCode || null
      };

      if (isEditing) {
        await axiosClient.put(`/profile/${id}`, payload);
      } else {
        await axiosClient.post('/profile', payload);
      }
      
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ này? Toàn bộ lịch sử xem sẽ bị mất.")) return;
    
    setIsDeleting(true);
    try {
      await axiosClient.delete(`/profile/${id}`);
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa hồ sơ.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
      
      {/* Header gọn gàng */}
      <div className="p-6 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => navigate('/profiles')}
          className="flex items-center text-gray-400 hover:text-white transition gap-2 font-medium"
        >
          <ArrowLeft className="w-6 h-6" /> Quay lại
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl animate-fade-in-up">
          <h1 className="text-4xl font-medium mb-8 border-b border-gray-700 pb-4">
            {isEditing ? 'Sửa hồ sơ' : 'Thêm hồ sơ'}
          </h1>

          {error && (
            <div className="bg-[#E50914]/20 border border-[#E50914] text-white p-4 rounded mb-6">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            
            {/* Cột trái: Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-md overflow-hidden shadow-2xl">
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                {defaultAvatars.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url}
                    alt="Avatar option"
                    className={`w-10 h-10 cursor-pointer rounded-sm border-2 transition ${formData.avatarUrl === url ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    onClick={() => setFormData({...formData, avatarUrl: url})}
                  />
                ))}
              </div>
            </div>

            {/* Cột phải: Form nhập liệu */}
            <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-700 pt-6 md:pt-0 md:pl-12">
              <div className="space-y-6 max-w-md">
                
                {/* Tên hồ sơ */}
                <div>
                  <input 
                    type="text" 
                    placeholder="Tên hồ sơ"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#666] text-white px-4 py-3 rounded text-xl focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-300"
                  />
                </div>

                {/* Tùy chọn Trẻ em (Dùng Toggle Switch chống lỗi) */}
                <div className="flex items-center gap-3 mt-6">
                  <div 
                    onClick={() => setFormData({...formData, isKids: !formData.isKids})}
                    className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${formData.isKids ? 'bg-[#E50914]' : 'bg-gray-600'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isKids ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <label 
                    className="text-xl text-gray-300 cursor-pointer select-none" 
                    onClick={() => setFormData({...formData, isKids: !formData.isKids})}
                  >
                    Tài khoản dành cho Trẻ em?
                  </label>
                </div>
                <p className="text-gray-400 text-sm">Nếu được chọn, hồ sơ này sẽ chỉ hiển thị các chương trình và phim có xếp hạng độ tuổi từ 12 trở xuống.</p>

                {/* Khóa PIN */}
                <div className="pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-medium mb-2">Khóa hồ sơ (Tùy chọn)</h3>
                  <p className="text-gray-400 text-sm mb-4">Nhập mã PIN gồm 4 chữ số để chặn người khác truy cập vào hồ sơ này.</p>
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="Mã PIN 4 số"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({...formData, pinCode: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-[#666] text-white px-4 py-3 rounded text-xl focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-300 tracking-[0.5em] font-mono"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex flex-wrap gap-4 mt-12 border-t border-gray-700 pt-6">
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-white text-black hover:bg-[#c00] hover:text-white transition px-8 py-3 font-bold uppercase tracking-wider min-w-[120px] flex justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Lưu'}
            </button>
            <button 
              onClick={() => navigate('/profiles')}
              className="border border-gray-500 text-gray-500 hover:text-white hover:border-white transition px-8 py-3 font-medium uppercase tracking-wider"
            >
              Hủy
            </button>
            
            {isEditing && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="md:ml-auto border border-gray-500 text-gray-500 hover:text-white hover:border-white transition px-8 py-3 font-medium uppercase tracking-wider flex justify-center min-w-[120px]"
              >
                {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Xóa hồ sơ'}
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default EditProfile;
