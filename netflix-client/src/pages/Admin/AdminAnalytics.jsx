import { useEffect, useState } from "react";
import { PlayCircle, ThumbsUp, Loader2 } from "lucide-react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { adminApi } from "../../api/adminApi";

const AdminAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [watchStats, setWatchStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminApi.getSummary(), adminApi.getWatchStats()])
      .then(([s, w]) => {
        setSummary(s);
        setWatchStats(Array.isArray(w) ? w : []);
      })
      .catch(() => setError("Không thể tải dữ liệu thống kê."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#e50914]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Thống kê chi tiết</h1>
        <p className="mb-8 text-sm text-[#777]">Dữ liệu phân tích hệ thống</p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Daily registrations chart */}
          {summary && (
            <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5">
              <h2 className="mb-1 text-sm font-semibold text-white">
                Đăng ký theo ngày (14 ngày)
              </h2>
              <p className="mb-4 text-xs text-[#666]">
                Số người dùng mới mỗi ngày
              </p>
              <div className="flex h-40 items-end gap-1">
                {summary.dailyRegistrations.map((d) => {
                  const max = Math.max(
                    ...summary.dailyRegistrations.map((x) => x.count),
                    1,
                  );
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <div
                      key={d.date}
                      className="group relative flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="invisible absolute -top-5 whitespace-nowrap rounded bg-[#333] px-1.5 py-0.5 text-[10px] text-white group-hover:visible">
                        {d.count}
                      </span>
                      <div
                        className="w-full rounded-t bg-[#e50914]/60 transition-all group-hover:bg-[#e50914]"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="w-full overflow-hidden text-center text-[8px] text-[#555]">
                        {d.date.slice(8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan distribution */}
          {summary && (
            <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5">
              <h2 className="mb-1 text-sm font-semibold text-white">
                Phân bổ gói đăng ký
              </h2>
              <p className="mb-4 text-xs text-[#666]">
                {summary.subscribedUsers.toLocaleString()} /{" "}
                {summary.totalUsers.toLocaleString()} người dùng trả phí
              </p>
              {summary.planDistribution.length === 0 ? (
                <p className="text-sm text-[#555]">Chưa có dữ liệu gói.</p>
              ) : (
                <div className="space-y-4">
                  {summary.planDistribution.map((p) => {
                    const total = summary.planDistribution.reduce(
                      (s, x) => s + x.count,
                      0,
                    );
                    const pct = Math.round((p.count / (total || 1)) * 100);
                    return (
                      <div key={p.plan}>
                        <div className="flex justify-between text-xs text-[#bbb] mb-1.5">
                          <span className="font-medium">{p.plan}</span>
                          <span>
                            {p.count.toLocaleString()} người ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-[#e50914] to-[#ff6b6b] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Top movies watched (last 30 days) */}
          <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5 lg:col-span-2">
            <h2 className="mb-1 text-sm font-semibold text-white">
              Top xem nhiều nhất – 30 ngày qua
            </h2>
            <p className="mb-4 text-xs text-[#666]">
              Các phim được xem nhiều nhất từ DB nội bộ
            </p>
            {watchStats.length === 0 ? (
              <p className="text-sm text-[#555]">Chưa có lượt xem nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] text-xs text-[#666]">
                      <th className="pb-2 text-left font-medium">#</th>
                      <th className="pb-2 text-left font-medium">Phim</th>
                      <th className="pb-2 text-right font-medium">Lượt xem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchStats.map((m, i) => (
                      <tr key={m.id} className="border-b border-[#1e1e1e]">
                        <td className="py-3 text-[#555] w-8">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {m.posterUrl ? (
                              <img
                                src={m.posterUrl}
                                alt={m.title}
                                className="h-9 w-6 rounded object-cover"
                              />
                            ) : (
                              <div className="h-9 w-6 rounded bg-[#2a2a2a]" />
                            )}
                            <div>
                              <p className="font-medium text-white">
                                {m.title}
                              </p>
                              <p className="text-xs text-[#666]">ID: {m.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-[#aaa]">
                            <PlayCircle className="h-3.5 w-3.5" />
                            {m.watchCount.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All-time top from summary */}
          {summary && summary.topMovies.length > 0 && (
            <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5 lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-white">
                Top xem nhiều nhất – Tổng cộng
              </h2>
              <p className="mb-4 text-xs text-[#666]">Tính từ khi có dữ liệu</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] text-xs text-[#666]">
                      <th className="pb-2 text-left font-medium">#</th>
                      <th className="pb-2 text-left font-medium">Phim</th>
                      <th className="pb-2 text-right font-medium">Lượt xem</th>
                      <th className="pb-2 text-right font-medium">
                        <span className="flex items-center justify-end gap-1">
                          <ThumbsUp className="h-3 w-3" /> Thích
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topMovies.map((m, i) => (
                      <tr key={m.movieId} className="border-b border-[#1e1e1e]">
                        <td className="py-2 text-[#555] w-8">{i + 1}</td>
                        <td className="py-2 text-white">{m.title}</td>
                        <td className="py-2 text-right text-[#aaa]">
                          {m.watchCount.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-green-400">
                          {m.likeCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
