import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import useProfileStore from '../../store/profileStore';
import { Edit2, PlusCircle, Lock, Loader2 } from 'lucide-react';
import PinModal from '../../components/modals/PinModal';

const defaultAvatars = [
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/1.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/2.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/3.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/4.png",
  "https://raw.githubusercontent.com/karlhadwen/netflix/master/public/images/users/5.png"
];

const ManageProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [isManaging, setIsManaging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState(null);
  
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axiosClient.get('/profile');
      setProfiles(response.data.data);
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = (profile) => {
    if (isManaging) {
      // Nhảy sang trang Edit
      navigate(`/profiles/edit/${profile.id}`, { state: { profile } });
    } else {
      if (profile.hasPin) {
        setSelectedProfileForPin(profile);
      } else {
        // Vào thẳng
        setActiveProfile(profile);
        navigate('/browse');
      }
    }
  };

  const handlePinSuccess = () => {
    setActiveProfile(selectedProfileForPin);
    navigate('/browse');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-[#E50914] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
      
      <div className="text-center animate-fade-in-up">
        <h1 className="text-3xl md:text-5xl font-medium mb-8">
          {isManaging ? "Quản lý hồ sơ" : "Ai đang xem?"}
        </h1>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl mx-auto mb-16">
          {profiles.map((profile) => (
            <div 
              key={profile.id} 
              className="flex flex-col items-center group cursor-pointer w-[100px] md:w-[150px]"
              onClick={() => handleProfileClick(profile)}
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 border-2 border-transparent group-hover:border-white transition duration-300">
                <img 
                  src={profile.avatarUrl || defaultAvatars[0]} 
                  alt={profile.name} 
                  className={`w-full h-full object-cover ${isManaging ? 'opacity-50' : ''}`}
                />
                
                {/* Lớp phủ mờ khi quản lý */}
                {isManaging && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Edit2 className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {/* Icon khóa nếu có PIN */}
                {profile.hasPin && !isManaging && (
                  <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <span className={`text-gray-400 group-hover:text-white transition text-sm md:text-xl ${isManaging ? 'font-bold text-white' : ''}`}>
                {profile.name}
              </span>
            </div>
          ))}

          {/* Nút thêm hồ sơ */}
          {profiles.length < 5 && (
            <div 
              className="flex flex-col items-center group cursor-pointer w-[100px] md:w-[150px]"
              onClick={() => navigate('/profiles/create')}
            >
              <div className="w-full aspect-square rounded-md mb-4 flex items-center justify-center hover:bg-[#e5e5e5] transition duration-300 group-hover:bg-white border-2 border-transparent">
                <PlusCircle className="w-16 h-16 text-gray-400 group-hover:text-black transition" />
              </div>
              <span className="text-gray-400 group-hover:text-white transition text-sm md:text-xl">
                Thêm hồ sơ
              </span>
            </div>
          )}
        </div>

        {/* Nút Quản lý */}
        {!isManaging ? (
          <button 
            onClick={() => setIsManaging(true)}
            className="border border-gray-500 text-gray-500 hover:text-white hover:border-white transition px-6 py-2 text-xl font-medium uppercase tracking-wider"
          >
            Quản lý hồ sơ
          </button>
        ) : (
          <button 
            onClick={() => setIsManaging(false)}
            className="bg-white text-black hover:bg-[#c00] hover:text-white transition px-8 py-2 text-xl font-bold uppercase tracking-wider"
          >
            Hoàn tất
          </button>
        )}
      </div>

      {/* Modal nhập mã PIN */}
      {selectedProfileForPin && (
        <PinModal 
          profile={selectedProfileForPin}
          onClose={() => setSelectedProfileForPin(null)}
          onSuccess={handlePinSuccess}
        />
      )}

      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default ManageProfiles;
