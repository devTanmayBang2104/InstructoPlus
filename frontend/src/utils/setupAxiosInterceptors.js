import axios from "axios";
import { serverUrl } from "../App.jsx";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupAxiosInterceptors = () => {
  // Ensure withCredentials is set globally for cookie transmission
  axios.defaults.withCredentials = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Avoid intercepting auth routes to prevent infinite retry loops
      const isAuthRoute =
        originalRequest?.url?.includes("/api/auth/refresh") ||
        originalRequest?.url?.includes("/api/auth/login") ||
        originalRequest?.url?.includes("/api/auth/signup");

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
        if (isRefreshing) {
          // If already refreshing, push this request to the queue until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => axios(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt token rotation
          const refreshRes = await axios.post(
            `${serverUrl}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );

          if (refreshRes.data?.success) {
            processQueue(null, refreshRes.data.token);
            return axios(originalRequest);
          } else {
            processQueue(new Error("Token refresh failed"), null);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
