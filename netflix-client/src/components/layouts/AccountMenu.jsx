import { Link, useNavigate } from "react-router-dom";
import { Pencil, ArrowLeftRight, User, HelpCircle, Lock } from "lucide-react";
import useProfileStore from "../../store/profileStore";

const AccountMenu = ({
  visible,
  profile,
  onSwitchProfile,
  onSelectProfile,
  onLogout,
  onClose,
}) => {
  const profiles = useProfileStore((state) => state.profiles) || [];
  const navigate = useNavigate();

  if (!visible) {
    return null;
  }

  // Lấy các profile KHÁC profile hiện tại
  const otherProfiles = profiles.filter((p) => p.id !== profile?.id);

  return (
    <div
      className="absolute right-0 top-0 z-40 motion-menu-in flex w-[230px] flex-col bg-[#141414] text-sm"
      style={{ border: '1px solid #444' }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Mũi tên trỏ lên màu trắng (outline) */}
      <div
        className="absolute right-3"
        style={{
          top: '-9px',
          width: 0, height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '9px solid #ffffff',
        }}
      ></div>
      {/* Lớp trong của mũi tên (màu nền) */}
      <div
        className="absolute right-[14px]"
        style={{
          top: '-6px',
          width: 0, height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '7px solid #141414',
        }}
      ></div>

      <div className="flex flex-col gap-3 p-4 pb-3">
        {otherProfiles.map((p) => (
          <div
            key={p.id}
            onClick={() => {
               onSelectProfile?.(p);
            }}
            className="group/item flex w-full cursor-pointer flex-row items-center gap-3"
          >
            <img
              className="w-8 rounded"
              src={p.avatarUrl || "/images/default-blue.png"}
              alt={p.name}
            />
            <p className="text-[#e5e5e5] group-hover/item:underline flex-1 truncate text-sm">
              {p.name}
            </p>
            {p.hasPin && <Lock className="w-4 h-4 text-gray-500" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <Link
          to="/profiles"
          onClick={() => onClose?.()}
          className="flex items-center gap-3 text-[#e5e5e5] hover:underline"
        >
          <Pencil className="w-5 h-5 text-gray-400 p-[1px]" />
          <span className="text-sm">Quản lý hồ sơ</span>
        </Link>
        <button
          onClick={() => {
            onSwitchProfile();
          }}
          className="flex items-center gap-3 text-[#e5e5e5] hover:underline"
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-400 p-[1px]" />
          <span className="text-sm">Chuyển hồ sơ</span>
        </button>
        <Link
          to="/choose-plan"
          onClick={() => onClose?.()}
          className="flex items-center gap-3 text-[#e5e5e5] hover:underline"
        >
          <User className="w-5 h-5 text-gray-400 p-[1px]" />
          <span className="text-sm">Tài khoản</span>
        </Link>
        <button
          className="flex items-center gap-3 text-[#e5e5e5] hover:underline text-left"
        >
          <HelpCircle className="w-5 h-5 text-gray-400 p-[1px]" />
          <span className="text-sm">Trung tâm trợ giúp</span>
        </button>
      </div>

      <hr className="h-px border-0 bg-gray-700" />

      <button
        type="button"
        onClick={() => {
          onLogout();
          onClose?.();
        }}
        className="px-4 py-4 text-center text-[13px] font-bold text-white hover:underline"
      >
        Đăng xuất khỏi Netflix
      </button>
    </div>
  );
};

export default AccountMenu;
