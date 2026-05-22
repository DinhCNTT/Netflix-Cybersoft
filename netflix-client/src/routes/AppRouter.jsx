import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import CheckEmail from '../pages/Auth/CheckEmail';
import VerifyEmail from '../pages/Auth/VerifyEmail';
import ChoosePlan from '../pages/Auth/ChoosePlan';
import Checkout from '../pages/Auth/Checkout';
import useAuthStore from '../store/authStore';

// Simple protected route component
const ProtectedRoute = ({ children, requireSubscription = true }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu route yêu cầu phải nạp gói, nhưng user chưa nạp -> Đẩy ra chọn gói
  // Lưu ý: claim IsSubscribed từ JWT sẽ lưu dưới dạng string "true"/"false" hoặc boolean
  const isSubscribed = user?.isSubscribed === true || user?.isSubscribed === "true";
  
  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/choose-plan" replace />;
  }

  // Nếu route KHÔNG yêu cầu nạp gói (như trang choose-plan), nhưng user ĐÃ nạp rồi -> Đẩy vào /browse
  if (!requireSubscription && isSubscribed) {
    return <Navigate to="/browse" replace />;
  }

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

        {/* Protected Routes (Subscription Required) */}
        <Route 
          path="/browse" 
          element={
            <ProtectedRoute requireSubscription={true}>
              <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
                <h1 className="text-4xl">Welcome to Netflix Clone (Browse Page)</h1>
                <button 
                  onClick={() => useAuthStore.getState().logout()}
                  className="ml-4 px-4 py-2 bg-red-600 rounded"
                >
                  Logout
                </button>
              </div>
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
