import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMe = error.config?.url?.includes("/api/auth/me/");
    if (
      error.response?.status === 401 &&
      !isAuthMe &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(error);
  }
);
