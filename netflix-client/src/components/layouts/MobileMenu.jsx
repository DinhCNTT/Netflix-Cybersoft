const MobileMenu = ({ visible, onClose, onNavigate }) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="absolute left-0 top-8 z-40 motion-menu-in flex w-56 flex-col border-2 border-gray-800 bg-black py-5"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.("/browse");
            onClose?.();
          }}
          className="px-3 text-center text-white hover:underline"
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="px-3 text-center text-white hover:underline"
        >
          Series
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="px-3 text-center text-white hover:underline"
        >
          Films
        </button>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="px-3 text-center text-white hover:underline"
        >
          New & Popular
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.("/browse/my-list");
            onClose?.();
          }}
          className="px-3 text-center text-white hover:underline"
        >
          My List
        </button>
      </div>
    </div>
  );
};

export default MobileMenu;
