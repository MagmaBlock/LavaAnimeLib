import { useThrottleFn } from "@vueuse/core";
import axios from "axios";

export const apiBaseUrl = useRuntimeConfig().public.apiBaseUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
});

const goToLogin = useThrottleFn(() => {
  window.$message.warning("尚未登录...");
  useRouter().push({ path: "/auth/login" });
}, 5000);

// 请求前置 - 增加验证头
api.interceptors.request.use(function (config) {
  config.headers.Authorization = getToken();
  return config;
});

// 请求响应处理
api.interceptors.response.use(
  // 2xx
  function (response) {
    return response;
  },
  // !2xx
  function (error) {
    // 请求可以在 config 中添加 noCatch 字段禁止错误处理
    if ((error.config as Record<string, unknown>)?.noCatch) return Promise.reject(error);
    // 未登录处理
    if (error?.response?.status == 401) {
      localStorage.removeItem("token");
      goToLogin();
    }
    // 网络错误
    else if (error.code == "ERR_NETWORK") {
      console.error(error);
      window.$message.error("无法连接到服务器");
    }
    // 含有错误信息的服务端响应
    else if (error?.response?.data.message) {
      window.$message.error(error.response.data.message);
    }
    // 其他错误处理
    else {
      console.error("后端请求错误", error);
    }
    return Promise.reject(error);
  }
);

export function getToken(): string | undefined {
  const raw = localStorage.getItem("token");
  if (!raw) return;
  const token = JSON.parse(raw) as { expirationTime: string; value: string };
  if (new Date(token.expirationTime) > new Date()) {
    return token.value;
  }
}
