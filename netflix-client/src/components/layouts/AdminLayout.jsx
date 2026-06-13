import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Film,
  BarChart2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useProfileStore from "../../store/profileStore";

const NAV = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/movies", label: "Phim", icon: Film },
  { to: "/admin/analytics", label: "Thống kê", icon: BarChart2 },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const clearProfile = useProfileStore((s) => s.clearProfile);

  const handleLogout = () => {
    logout();
    clearProfile();
    navigate("/login");
  };

  const isActive = (nav) => {
    if (nav.exact) return location.pathname === nav.to;
    return location.pathname.startsWith(nav.to);
  };

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-[#222] bg-[#141414]">
        <div className="flex h-16 items-center border-b border-[#222] px-5">
          <Link to="/browse" className="flex items-center gap-2">
            <img
              src="/images/netflix-logo.png"
              alt="Netflix"
              className="h-5 w-auto"
            />
            <span className="text-xs font-bold text-[#e50914]">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#e50914]/15 text-[#e50914]"
                    : "text-[#aaa] hover:bg-[#1e1e1e] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#222] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#aaa] transition-colors hover:bg-[#1e1e1e] hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
