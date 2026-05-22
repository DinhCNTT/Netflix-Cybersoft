import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useProfileStore from '../../store/profileStore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { activeProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    clearProfile();
    navigate('/login');
  };

  const handleSwitchProfile = () => {
    clearProfile();
    navigate('/profiles');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 md:px-12 py-4 flex items-center justify-between font-['Helvetica_Neue',Helvetica,Arial,sans-serif] ${
        isScrolled ? 'bg-[#141414] shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="flex items-center gap-8">
        <Link to="/browse">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" 
            alt="Netflix" 
            className="w-24 md:w-28 object-contain"
          />
        </Link>
        <ul className="hidden md:flex items-center gap-5 text-sm font-medium">
          <li className="text-white cursor-pointer hover:text-gray-300 transition">Trang chủ</li>
          <li className="text-gray-300 cursor-pointer hover:text-white transition">Phim T.hình</li>
          <li className="text-gray-300 cursor-pointer hover:text-white transition">Phim Điện ảnh</li>
          <li className="text-gray-300 cursor-pointer hover:text-white transition">Mới & Phổ biến</li>
          <li className="text-gray-300 cursor-pointer hover:text-white transition">Danh sách của tôi</li>
        </ul>
      </div>

      <div className="flex items-center gap-6">
        <Search className="w-6 h-6 text-white cursor-pointer" />
        <span className="hidden md:block text-white text-sm cursor-pointer">{activeProfile?.isKids ? 'Trẻ em' : ''}</span>
        <Bell className="w-6 h-6 text-white cursor-pointer" />
        
        <div 
          className="relative flex items-center gap-2 cursor-pointer group"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <img 
            src={activeProfile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} 
            alt="Profile" 
            className="w-8 h-8 rounded"
          />
          <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 pt-4 w-48">
              <div className="bg-black/90 border border-gray-800 rounded shadow-xl py-2 flex flex-col relative">
                <div className="absolute -top-2 right-4 w-4 h-4 bg-black/90 border-t border-l border-gray-800 rotate-45"></div>
                
                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                  <img src={activeProfile?.avatarUrl} alt="" className="w-6 h-6 rounded" />
                  <span className="text-sm text-white font-medium truncate">{activeProfile?.name}</span>
                </div>
                
                <button 
                  onClick={handleSwitchProfile}
                  className="px-4 py-3 text-sm text-gray-300 hover:text-white hover:underline text-left"
                >
                  Đổi người xem
                </button>
                <button 
                  onClick={handleSwitchProfile} // Thực chất cũng đưa về trang Profile để quản lý
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:underline text-left border-b border-gray-800"
                >
                  Quản lý hồ sơ
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="px-4 py-3 text-sm text-gray-300 hover:text-white hover:underline text-left mt-2"
                >
                  Đăng xuất khỏi Netflix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
