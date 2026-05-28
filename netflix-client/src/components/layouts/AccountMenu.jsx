import { Link } from "react-router-dom";

const AccountMenu = ({
  visible,
  profile,
  onSwitchProfile,
  onLogout,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="absolute right-0 top-14 z-40 motion-menu-in flex w-56 flex-col border-2 border-gray-800 bg-black py-5"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-3">
        <div className="group/item flex w-full flex-row items-center gap-3 px-3">
          <img
            className="w-8 rounded-md"
            src={profile?.avatarUrl || "/images/default-blue.png"}
            alt={profile?.name || "profile"}
          />
          <p className="text-sm text-white group-hover/item:underline">
            {profile?.name || "Profile"}
          </p>
        </div>
      </div>

      <hr className="my-4 h-px border-0 bg-gray-600" />

      <button
        type="button"
        onClick={() => {
          onSwitchProfile();
          onClose?.();
        }}
        className="px-3 py-2 text-left text-sm text-white hover:underline"
      >
        Switch Profile
      </button>
      <Link
        to="/choose-plan"
        onClick={() => onClose?.()}
        className="px-3 py-2 text-left text-sm text-white hover:underline"
      >
        Account
      </Link>
      <button
        type="button"
        onClick={() => {
          onLogout();
          onClose?.();
        }}
        className="px-3 py-2 text-left text-sm text-white hover:underline"
      >
        Sign out of Netflix
      </button>
    </div>
  );
};

export default AccountMenu;
