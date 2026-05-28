import { Outlet, Link } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div
      className="relative min-h-screen bg-black bg-cover bg-center sm:bg-fixed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]"
      style={{
        backgroundImage: `url('/images/hero.jpg')`,
      }}
    >
      {/* Black gradient overlay matching Netflix style */}
      <div className="absolute inset-0 bg-black/50 sm:bg-transparent sm:bg-gradient-to-b sm:from-black/80 sm:via-black/40 sm:to-black/80"></div>

      {/* === Header === */}
      <header className="relative z-10 flex items-center px-4 py-4 sm:px-12 sm:py-6">
        <Link to="/">
          <img
            src="/images/netflix-logo.png"
            alt="Netflix"
            className="h-8 w-auto sm:h-12"
          />
        </Link>
      </header>

      {/* === Main Form Area === */}
      <main className="relative z-10 flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-0 sm:py-8">
        <div
          className="w-full max-w-[450px] rounded px-8 py-10 sm:px-16 sm:py-12"
          style={{
            background: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* === Footer === */}
      <footer className="relative z-10 py-8 text-[13px] border-t border-[#404040]/30 sm:bg-black/75 bg-black">
        <div className="mx-auto w-full max-w-[1000px] px-8 sm:px-16 text-[#A6A6A6]">
          <p className="mb-8 hover:underline cursor-pointer text-base">
            Bạn có câu hỏi? Liên hệ với chúng tôi.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            <Link to="#" className="hover:underline">
              FAQ
            </Link>
            <Link to="#" className="hover:underline">
              Help Center
            </Link>
            <Link to="#" className="hover:underline">
              Account
            </Link>
            <Link to="#" className="hover:underline">
              Media Center
            </Link>

            <Link to="#" className="hover:underline">
              Investor Relations
            </Link>
            <Link to="#" className="hover:underline">
              Jobs
            </Link>
            <Link to="#" className="hover:underline">
              Redeem Gift Cards
            </Link>
            <Link to="#" className="hover:underline">
              Buy Gift Cards
            </Link>

            <Link to="#" className="hover:underline">
              Ways to Watch
            </Link>
            <Link to="#" className="hover:underline">
              Terms of Use
            </Link>
            <Link to="#" className="hover:underline">
              Privacy
            </Link>
            <Link to="#" className="hover:underline">
              Cookie Preferences
            </Link>

            <Link to="#" className="hover:underline">
              Corporate Information
            </Link>
            <Link to="#" className="hover:underline">
              Contact Us
            </Link>
            <Link to="#" className="hover:underline">
              Speed Test
            </Link>
            <Link to="#" className="hover:underline">
              Legal Notices
            </Link>

            <Link to="#" className="hover:underline">
              Only on Netflix
            </Link>
          </div>
          <p className="mt-8 text-[13px]">Netflix Romania</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
