import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../../components/layouts/Navbar";
import { deviceApi } from "../../api/deviceApi";
import useAuthStore from "../../store/authStore";

const DEVICE_ICONS = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
  TV: Tv,
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DeviceCard = ({ session, onRevoke, isRevoking }) => {
  const Icon = DEVICE_ICONS[session.deviceType] ?? Monitor;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
        session.isCurrent
          ? "border-[#e50914]/60 bg-[#1f1010]"
          : "border-[#333] bg-[#1a1a1a]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            session.isCurrent ? "bg-[#e50914]/20" : "bg-[#2a2a2a]"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${session.isCurrent ? "text-[#e50914]" : "text-[#aaa]"}`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{session.deviceName}</p>
            {session.isCurrent && (
              <span className="flex items-center gap-1 rounded bg-[#e50914] px-2 py-0.5 text-[10px] font-bold text-white">
                <ShieldCheck className="h-3 w-3" />
                Thiết bị này
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#888]">
            Lần cuối hoạt động: {formatDate(session.lastSeenAt)}
          </p>
          <p className="text-xs text-[#666]">
            Đăng nhập: {formatDate(session.createdAt)}
            {session.ipAddress && ` • IP: ${session.ipAddress}`}
          </p>
        </div>
      </div>

      {!session.isCurrent && (
        <button
          type="button"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking === session.id}
          className="ml-4 flex shrink-0 items-center gap-2 rounded border border-[#444] px-3 py-2 text-xs font-medium text-[#ccc] transition-colors hover:border-[#e50914] hover:text-[#e50914] disabled:opacity-50"
        >
          {isRevoking === session.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          Đăng xuất
        </button>
      )}
    </div>
  );
};

const Devices = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(null); // sessionId being revoked
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await deviceApi.getDevices();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      showToast("Không thể tải danh sách thiết bị.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleRevoke = useCallback(
    async (sessionId) => {
      setIsRevoking(sessionId);
      try {
        await deviceApi.revokeDevice(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showToast("Đã đăng xuất thiết bị.");
      } catch {
        showToast("Có lỗi xảy ra.");
      } finally {
        setIsRevoking(null);
      }
    },
    [showToast],
  );

  const handleRevokeOthers = useCallback(async () => {
    setIsRevokingAll(true);
    try {
      await deviceApi.revokeOtherDevices();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast("Đã đăng xuất tất cả thiết bị khác.");
    } catch {
      showToast("Có lỗi xảy ra.");
    } finally {
      setIsRevokingAll(false);
    }
  }, [showToast]);

  const handleRevokeAll = useCallback(async () => {
    setIsRevokingAll(true);
    try {
      await deviceApi.revokeAllDevices();
      logout();
      navigate("/login");
    } catch {
      showToast("Có lỗi xảy ra.");
      setIsRevokingAll(false);
    }
  }, [logout, navigate, showToast]);

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 pt-28 pb-16 md:px-6">
        <h1 className="mb-2 text-2xl font-bold">Quản lý thiết bị</h1>
        <p className="mb-8 text-sm text-[#aaa]">
          Danh sách các thiết bị đang đăng nhập vào tài khoản của bạn. Đăng xuất
          khỏi các thiết bị lạ để bảo vệ tài khoản.
        </p>

        {/* Actions */}
        {!isLoading && otherCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRevokeOthers}
              disabled={isRevokingAll}
              className="flex items-center gap-2 rounded border border-[#555] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#e50914] hover:text-[#e50914] disabled:opacity-50"
            >
              {isRevokingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Đăng xuất tất cả thiết bị khác ({otherCount})
            </button>

            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={isRevokingAll}
              className="flex items-center gap-2 rounded border border-[#e50914]/50 px-4 py-2 text-sm font-medium text-[#e50914] transition-colors hover:border-[#e50914] hover:bg-[#e50914]/10 disabled:opacity-50"
            >
              {isRevokingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Đăng xuất tất cả (kể cả thiết bị này)
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-[#2a2a2a]"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && sessions.length === 0 && (
          <div className="py-16 text-center text-[#666]">
            <Monitor className="mx-auto mb-4 h-14 w-14" />
            <p>Không có phiên đăng nhập nào.</p>
          </div>
        )}

        {/* Session list */}
        {!isLoading && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Current device first */}
            {sessions
              .slice()
              .sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0))
              .map((session) => (
                <DeviceCard
                  key={session.id}
                  session={session}
                  onRevoke={handleRevoke}
                  isRevoking={isRevoking}
                />
              ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 rounded bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Devices;
