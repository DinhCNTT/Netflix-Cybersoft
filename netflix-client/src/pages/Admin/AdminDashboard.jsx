import { useEffect, useState } from "react";
import {
  Users,
  Film,
  PlayCircle,
  Monitor,
  TrendingUp,
  Crown,
} from "lucide-react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { adminApi } from "../../api/adminApi";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="flex items-center gap-4 rounded-lg border border-[#222] bg-[#1a1a1a] p-5">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}
    >
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      <p className="text-xs text-[#aaa]">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-[#666]">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getSummary()
      .then(setSummary)
      .catch(() => setError("Không thể tải dữ liệu tổng quan."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Tổng quan</h1>
        <p className="mb-8 text-sm text-[#777]">Số liệu tổng hợp hệ thống</p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-[#222]"
              />
            ))}
          </div>
        ) : (
          summary && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                <StatCard
                  icon={Users}
                  label="Tổng người dùng"
                  value={summary.totalUsers.toLocaleString()}
                  color="bg-blue-600"
                />
                <StatCard
                  icon={Crown}
                  label="Người dùng trả phí"
                  value={summary.subscribedUsers.toLocaleString()}
                  sub={`${Math.round((summary.subscribedUsers / (summary.totalUsers || 1)) * 100)}% chuyển đổi`}
                  color="bg-yellow-600"
                />
                <StatCard
                  icon={Film}
                  label="Phim trong DB"
                  value={summary.totalMovies.toLocaleString()}
                  sub={`${summary.activeMovies} đang hiển thị`}
                  color="bg-purple-600"
                />
                <StatCard
                  icon={PlayCircle}
                  label="Tổng lượt xem"
                  value={summary.totalWatchCount.toLocaleString()}
                  color="bg-green-600"
                />
                <StatCard
                  icon={Users}
                  label="Hồ sơ"
                  value={summary.totalProfiles.toLocaleString()}
                  color="bg-pink-600"
                />
                <StatCard
                  icon={Monitor}
                  label="Phiên đang hoạt động"
                  value={summary.activeSessionsNow.toLocaleString()}
                  color="bg-orange-600"
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Daily registrations */}
                <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <TrendingUp className="h-4 w-4 text-[#e50914]" />
                    Đăng ký 14 ngày qua
                  </h2>
                  <div className="flex h-32 items-end gap-1">
                    {summary.dailyRegistrations.map((d) => {
                      const max = Math.max(
                        ...summary.dailyRegistrations.map((x) => x.count),
                        1,
                      );
                      const pct = Math.round((d.count / max) * 100);
                      return (
                        <div
                          key={d.date}
                          className="group relative flex-1"
                          title={`${d.date}: ${d.count}`}
                        >
                          <div
                            className="w-full rounded-t bg-[#e50914]/70 transition-all group-hover:bg-[#e50914]"
                            style={{ height: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-[#555]">
                    <span>{summary.dailyRegistrations[0]?.date?.slice(5)}</span>
                    <span>
                      {summary.dailyRegistrations[
                        summary.dailyRegistrations.length - 1
                      ]?.date?.slice(5)}
                    </span>
                  </div>
                </div>

                {/* Plan distribution */}
                <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5">
                  <h2 className="mb-4 text-sm font-semibold text-white">
                    Phân bổ gói đăng ký
                  </h2>
                  {summary.planDistribution.length === 0 ? (
                    <p className="text-sm text-[#666]">Chưa có dữ liệu.</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.planDistribution.map((p) => {
                        const total = summary.planDistribution.reduce(
                          (s, x) => s + x.count,
                          0,
                        );
                        const pct = Math.round((p.count / (total || 1)) * 100);
                        return (
                          <div key={p.plan}>
                            <div className="flex justify-between text-xs text-[#bbb] mb-1">
                              <span>{p.plan}</span>
                              <span>
                                {p.count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#2a2a2a]">
                              <div
                                className="h-2 rounded-full bg-[#e50914]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top movies */}
                <div className="rounded-lg border border-[#222] bg-[#1a1a1a] p-5 lg:col-span-2">
                  <h2 className="mb-4 text-sm font-semibold text-white">
                    Top phim xem nhiều nhất
                  </h2>
                  {summary.topMovies.length === 0 ? (
                    <p className="text-sm text-[#666]">Chưa có lượt xem nào.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2a] text-[#666]">
                            <th className="pb-2 text-left font-medium">#</th>
                            <th className="pb-2 text-left font-medium">
                              Tên phim
                            </th>
                            <th className="pb-2 text-right font-medium">
                              Lượt xem
                            </th>
                            <th className="pb-2 text-right font-medium">
                              Thích
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.topMovies.map((m, i) => (
                            <tr
                              key={m.movieId}
                              className="border-b border-[#1e1e1e]"
                            >
                              <td className="py-2 text-[#666]">{i + 1}</td>
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
                  )}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
