import axios from "axios";
import useAuthStore from "../store/authStore";
import useProfileStore from "../store/profileStore";

const axiosClient = axios.create({
  baseURL: "http://localhost:5071/api", // Updated to match actual backend port
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for sending token
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    const activeProfile = useProfileStore.getState().activeProfile;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (activeProfile?.id) {
      config.headers["X-Profile-Id"] = activeProfile.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor for handling 401 & refreshing token
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          "http://localhost:5071/api/auth/refresh-token",
          `"${refreshToken}"`,
          {
            headers: { "Content-Type": "application/json" },
          },
        );

        if (data && data.data) {
          useAuthStore
            .getState()
            .setTokens(data.data.accessToken, data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
