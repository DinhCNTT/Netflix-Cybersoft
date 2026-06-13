import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { adminApi } from "../../api/adminApi";

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="w-full max-w-sm rounded-lg border border-[#333] bg-[#1a1a1a] p-6">
      <div className="mb-3 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="mb-6 text-sm text-[#aaa]">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded border border-[#333] px-4 py-2 text-sm text-[#aaa] hover:border-[#555]"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          className="rounded bg-[#e50914] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Xác nhận
        </button>
      </div>
    </div>
  </div>
);

const AdminMovies = () => {
  const [data, setData] = useState({ total: 0, items: [] });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(null); // { movieId, title }
  const debounceRef = useRef(null);
  const PAGE_SIZE = 15;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminApi.getMovies({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
      });
      setData(result ?? { total: 0, items: [] });
    } catch {
      showToast("Không thể tải danh sách phim.");
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

  const handleToggleActive = async (movie) => {
    setActionId(movie.id);
    try {
      await adminApi.toggleMovieActive(movie.id, !movie.isActive);
      showToast(movie.isActive ? "Đã ẩn phim." : "Đã hiện phim.");
      load();
    } catch {
      showToast("Có lỗi xảy ra.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const id = confirm.movieId;
    setConfirm(null);
    setActionId(`del-${id}`);
    try {
      await adminApi.deleteMovie(id);
      showToast("Đã xóa phim.");
      load();
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
            <h1 className="text-2xl font-bold">Phim (DB nội bộ)</h1>
            <p className="mt-0.5 text-sm text-[#777]">
              {data.total.toLocaleString()} bản ghi trong DB — đây là các phim
              đã được thêm streaming URL / trailer
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm tên phim..."
              className="w-full rounded-md border border-[#333] bg-[#1a1a1a] py-2 pl-9 pr-3 text-sm text-white placeholder-[#555] focus:border-[#555] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#222]">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a1a]">
              <tr className="border-b border-[#2a2a2a] text-left text-xs text-[#666]">
                <th className="px-4 py-3 font-medium">Phim</th>
                <th className="px-4 py-3 font-medium">Năm</th>
                <th className="px-4 py-3 font-medium">Phân loại</th>
                <th className="px-4 py-3 font-medium">Lượt xem</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
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
                    Không tìm thấy phim nào trong DB.
                  </td>
                </tr>
              ) : (
                data.items.map((movie) => (
                  <tr
                    key={movie.id}
                    className="border-b border-[#1e1e1e] bg-[#141414] hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-10 w-7 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-7 rounded bg-[#2a2a2a]" />
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {movie.title}
                          </p>
                          <p className="text-xs text-[#666]">ID: {movie.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {movie.releaseYear}
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {movie.maturityLevel}
                    </td>
                    <td className="px-4 py-3 text-[#aaa]">
                      {movie.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${movie.isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                      >
                        {movie.isActive ? "Hiển thị" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title={movie.isActive ? "Ẩn phim" : "Hiện phim"}
                          onClick={() => handleToggleActive(movie)}
                          disabled={actionId === movie.id}
                          className="rounded p-1.5 text-[#888] hover:bg-[#2a2a2a] hover:text-white disabled:opacity-40"
                        >
                          {actionId === movie.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : movie.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          title="Xóa khỏi DB"
                          onClick={() =>
                            setConfirm({
                              movieId: movie.id,
                              title: movie.title,
                            })
                          }
                          disabled={!!actionId}
                          className="rounded p-1.5 text-[#888] hover:bg-[#2a2a2a] hover:text-red-400 disabled:opacity-40"
                        >
                          {actionId === `del-${movie.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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

      {confirm && (
        <ConfirmDialog
          title="Xóa phim"
          message={`Xóa "${confirm.title}" khỏi DB nội bộ? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 rounded bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMovies;
