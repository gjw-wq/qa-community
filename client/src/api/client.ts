import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 15000
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "网络错误，请检查网络后重试";
    }
    const message = error.response.data?.message;
    return typeof message === "string" && message ? message : "请求失败，请稍后重试";
  }
  return "请求失败，请稍后重试";
}

export default client;
