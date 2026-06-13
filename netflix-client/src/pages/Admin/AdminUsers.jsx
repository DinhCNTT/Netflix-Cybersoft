import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { adminApi } from "../../api/adminApi";

const BADGE = {
  Admin: "bg-[#e50914]/20 text-[#e50914] border-[#e50914]/40",
  User: "bg-[#2a2a2a] text-[#aaa] border-[#333]",
};

const AdminUsers = () => {
  const [data, setData] = useState({ total: 0, items: [] });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [actionId, setActionId] = useState(null);
  const debounceRef = useRef(null);
  const PAGE_SIZE = 15;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminApi.getUsers({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
      });
      setData(result ?? { total: 0, items: [] });
    } catch {
      showToast("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleToggleActive = async (user) => {
    setActionId(user.id);
    try {
      await adminApi.toggleUserActive(user.id, !user.isActive);
      showToast(
        user.isActive ? "Đã vô hiệu hóa tài khoản." : "Đã kích hoạt tài khoản.",
      );
      load();
    } catch {
      showToast("Có lỗi xảy ra.");
    } finally {
      setActionId(null);
    }
  };

  const handleToggleRole = async (user) => {
    setActionId(user.id);
    try {
      const newRole = user.role === "Admin" ? "User" : "Admin";
      await adminApi.updateUserRole(user.id, newRole);
      showToast(`Đã đổi role thành ${newRole}.`);
      load();
    } catch (e) {
      showToast(e?.response?.data?.message ?? "Có lỗi xảy ra.");
    } finally {
      setActionId(null);
    }
  };

  const handleRevokeSessions = async (user) => {
    setActionId(`ses-${user.id}`);
    try {
      await adminApi.revokeUserSessions(user.id);
      showToast("Đã thu hồi tất cả phiên đăng nhập.");
    } catch {
      showToast("Có lỗi xảy ra.");
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Người dùng</h1>
            <p className="mt-0.5 text-sm text-[#777]">
              {data.total.toLocaleString()} tài khoản
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm email, tên..."
              className="w-full rounded-md border border-[#333] bg-[#1a1a1a] py-2 pl-9 pr-3 text-sm text-white placeholder-[#555] focus:border-[#555] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#222]">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a1a]">
              <tr className="border-b border-[#2a2a2a] text-left text-xs text-[#666]">
                <th className="px-4 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Gói</th>
                <th className="px-4 py-3 font-medium">Hồ sơ</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#555]">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#555]">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#1e1e1e] bg-[#141414] hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{user.fullName}</p>
                      <p className="text-xs text-[#666]">{user.email}</p>
                      <span
                        className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${BADGE[user.role] ?? BADGE.User}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`flex items-center gap-1 text-xs ${user.isActive ? "text-green-400" : "text-red-400"}`}
                        >
                          {user.isActive ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {user.isActive ? "Hoạt động" : "Vô hiệu"}
                        </span>
                        {!user.isEmailVerified && (
                          <span className="text-[10px] text-yellow-500">
                            Chưa xác thực email
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {user.isSubscribed ? (
                        <span className="text-green-400">
                          {user.subscriptionPlan ?? "Đã đăng ký"}
                        </span>
                      ) : (
                        <span className="text-[#555]">Miễn phí</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {user.profileCount}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          onClick={() => handleToggleActive(user)}
                          disabled={actionId === user.id}
                          className="rounded p-1.5 text-[#888] transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:opacity-40"
                        >
                          {actionId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          title={
                            user.role === "Admin"
                              ? "Hạ xuống User"
                              : "Nâng lên Admin"
                          }
                          onClick={() => handleToggleRole(user)}
                          disabled={actionId === user.id}
                          className="rounded p-1.5 text-[#888] transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:opacity-40"
                        >
                          {user.role === "Admin" ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          title="Thu hồi phiên đăng nhập"
                          onClick={() => handleRevokeSessions(user)}
                          disabled={actionId === `ses-${user.id}`}
                          className="rounded p-1.5 text-[#888] transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:opacity-40"
                        >
                          {actionId === `ses-${user.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[#777]">
            <span>
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded border border-[#333] px-3 py-1 hover:border-[#555] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded border border-[#333] px-3 py-1 hover:border-[#555] disabled:opacity-40"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 rounded bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
