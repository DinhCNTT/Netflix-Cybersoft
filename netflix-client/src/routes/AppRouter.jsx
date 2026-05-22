import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import CheckEmail from '../pages/Auth/CheckEmail';
import VerifyEmail from '../pages/Auth/VerifyEmail';
import ChoosePlan from '../pages/Auth/ChoosePlan';
import Checkout from '../pages/Auth/Checkout';
import ManageProfiles from '../pages/Profiles/ManageProfiles';
import EditProfile from '../pages/Profiles/EditProfile';
import Browse from '../pages/Browse/Browse';
import useAuthStore from '../store/authStore';
import useProfileStore from '../store/profileStore';

// Simple protected route component
const ProtectedRoute = ({ children, requireSubscription = true, requireProfile = false }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const activeProfile = useProfileStore((state) => state.activeProfile);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu route yêu cầu phải nạp gói, nhưng user chưa nạp -> Đẩy ra chọn gói
  // Lưu ý: claim IsSubscribed từ JWT sẽ lưu dưới dạng string "true"/"false" hoặc boolean
  const isSubscribed = user?.isSubscribed === true || user?.isSubscribed === "true";
  
  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/choose-plan" replace />;
  }

  if (!requireSubscription && isSubscribed) {
    // Nếu route KHÔNG yêu cầu nạp gói (như chọn gói, thanh toán) mà đã nạp rồi -> Đẩy vào chọn Profile
    return <Navigate to="/profiles" replace />;
  }

  // Nếu route CẦN chọn Profile (ví dụ /browse) nhưng user chưa chọn -> Ép chọn Profile
  if (requireSubscription && requireProfile && !activeProfile) {
    return <Navigate to="/profiles" replace />;
  }

  // Nếu route LÀ trang chọn Profile (requireProfile = false) nhưng user ĐÃ chọn rồi -> Đẩy vô Browse
  // (Trừ khi họ cố tình bấm nút quay ra trang quản lý profile)
  // Thực tế Netflix cho phép quay lại trang Profile, nên ta có thể không cần bắt buộc chặn chiều này.

  return children;
};

// Simple public route (redirects to browse if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/browse" replace />;
  }
  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/check-email" 
            element={
              <PublicRoute>
                <CheckEmail />
              </PublicRoute>
            } 
          />
          <Route 
            path="/verify-email" 
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            } 
          />
        </Route>

        {/* Protected Routes (Subscription Required & Profile Required) */}
        <Route 
          path="/browse" 
          element={
            <ProtectedRoute requireSubscription={true} requireProfile={true}>
              <Browse />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes (Subscription Required, Profile NOT Required) - Profile Management */}
        <Route 
          path="/profiles" 
          element={
            <ProtectedRoute requireSubscription={true} requireProfile={false}>
              <ManageProfiles />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profiles/create" 
          element={
            <ProtectedRoute requireSubscription={true} requireProfile={false}>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profiles/edit/:id" 
          element={
            <ProtectedRoute requireSubscription={true} requireProfile={false}>
              <EditProfile />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes (Subscription NOT Required - Payment Flow) */}
        <Route 
          path="/choose-plan" 
          element={
            <ProtectedRoute requireSubscription={false}>
              <div className="min-h-screen bg-black w-full overflow-x-hidden font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                <ChoosePlan />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute requireSubscription={false}>
              <div className="min-h-screen bg-black w-full overflow-x-hidden font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                <Checkout />
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
