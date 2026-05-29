import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useProfileStore from "../../store/profileStore";
import MobileMenu from "./MobileMenu";
import AccountMenu from "./AccountMenu";
import PinModal from "../modals/PinModal";

const TOP_OFFSET = 66;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { activeProfile, clearProfile, setActiveProfile } = useProfileStore();
  const [selectedProfileForPin, setSelectedProfileForPin] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= TOP_OFFSET) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowAccountMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    clearProfile();
    navigate("/login");
  };

  const handleSwitchProfile = () => {
    clearProfile();
    navigate("/profiles");
    setShowAccountMenu(false);
  };

  const handleSelectProfile = (profile) => {
    if (profile.hasPin) {
      setSelectedProfileForPin(profile);
    } else {
      setActiveProfile(profile);
      window.location.href = '/browse';
    }
  };

  const handlePinSuccess = () => {
    if (selectedProfileForPin) {
      setActiveProfile(selectedProfileForPin);
      setSelectedProfileForPin(null);
      window.location.href = '/browse';
    }
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu((current) => !current);
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu((current) => !current);
    setShowAccountMenu(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex h-[68px] items-center justify-between px-4 transition-all duration-[360ms] ease-[var(--nf-ease-out)] md:px-[4%] 2xl:px-[60px] ${
        isScrolled
          ? "bg-[#141414]/95 shadow-[0_12px_28px_rgba(0,0,0,0.42)] backdrop-blur-[2px]"
          : "bg-gradient-to-b from-[#101010]/90 via-[#151515]/45 to-transparent"
      }`}
    >
      <div className="flex items-center gap-4 md:gap-8">
        <Link to="/browse">
          <img
            src="/images/netflix-logo.png"
            alt="Netflix"
            className="h-5 w-auto object-contain md:h-6 lg:h-7"
            onError={(event) => {
              event.currentTarget.src = "/images/netflix-logo.png";
            }}
          />
        </Link>
        <ul className="hidden items-center gap-5 text-[13px] font-medium tracking-[0.01em] text-[#e5e5e5] lg:flex xl:gap-6">
          <li>
            <button
              type="button"
              onClick={() => navigate("/browse")}
              className="cursor-pointer text-white transition-colors duration-200 hover:text-[#b3b3b3]"
            >
              Trang chủ
            </button>
          </li>
          <li className="cursor-pointer transition-colors duration-200 hover:text-[#b3b3b3]">
            Series
          </li>
          <li className="cursor-pointer transition-colors duration-200 hover:text-[#b3b3b3]">
            Phim
          </li>
          <li className="cursor-pointer transition-colors duration-200 hover:text-[#b3b3b3]">
            Mới & Phổ biến
          </li>
          <li>
            <button
              type="button"
              onClick={() => navigate("/browse/my-list")}
              className="cursor-pointer transition-colors duration-200 hover:text-[#b3b3b3]"
            >
              Danh sách của tôi
            </button>
          </li>
          <li className="cursor-pointer text-[#d2d2d2] transition-colors duration-200 hover:text-white">
            Duyệt tìm theo ngôn ngữ
          </li>
        </ul>

        <div
          ref={mobileMenuRef}
          className="relative ml-2 flex cursor-pointer items-center gap-2 lg:hidden"
        >
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="flex items-center gap-2"
            aria-label="Toggle mobile menu"
          >
            <p className="text-sm text-white">Browse</p>
            <ChevronDown
              className={`h-4 w-4 text-white transition ${showMobileMenu ? "rotate-180" : ""}`}
            />
          </button>
          <MobileMenu
            visible={showMobileMenu}
            onNavigate={(path) => navigate(path)}
            onClose={() => setShowMobileMenu(false)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-5">
        <Search className="h-5 w-5 cursor-pointer text-white md:h-6 md:w-6" />
        {!activeProfile?.isKids && (
          <p 
             className="hidden cursor-pointer text-sm text-white hover:text-gray-300 md:block"
             onClick={() => navigate("/profiles")}
          >
            Trẻ em
          </p>
        )}
        
        <div className="relative">
          <Bell className="h-5 w-5 cursor-pointer text-white md:h-6 md:w-6" />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e50914] px-1 text-[10px] font-semibold leading-none text-white">
            1
          </span>
        </div>

        {/* Sử dụng group hover để hiện menu giống hệt web Netflix */}
        <div className="group relative flex cursor-pointer items-center gap-2">
          <img
            src={activeProfile?.avatarUrl || "/images/default-blue.png"}
            alt="Profile"
            className="h-7 w-7 rounded object-cover lg:h-8 lg:w-8"
          />
          <ChevronDown
            className="h-4 w-4 text-white transition-transform duration-300 group-hover:rotate-180 group-hover:text-gray-300"
          />
          
          {/* Vùng vô hình kéo dài để bridge hover từ avatar xuống menu */}
          <div className="pointer-events-none absolute inset-0 -bottom-8 group-hover:pointer-events-auto"></div>

          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-0 top-[calc(100%+12px)]">
            <AccountMenu
              visible={true}
              profile={activeProfile}
              onSwitchProfile={handleSwitchProfile}
              onSelectProfile={handleSelectProfile}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen PIN Modal for profile switching inside Navbar */}
      {selectedProfileForPin && (
        <PinModal
          profile={selectedProfileForPin}
          onClose={() => setSelectedProfileForPin(null)}
          onSuccess={handlePinSuccess}
        />
      )}
    </nav>
  );
};

export default Navbar;
