import { AxiosError } from "axios";

export function useUser() {
  const userInfo = ref<any>({});

  async function getUserInfo() {
    try {
      const result = await api.get("/v2/user/info");
      if (result.data.code == 200) {
        userInfo.value = result.data.data;
        return userInfo.value;
      }
    } catch (error) {
      if (error instanceof AxiosError && error.status == 401) {
        console.error("用户未登录");
      }
      userInfo.value = {};
      return userInfo.value;
    }
  }

  return reactive({ userInfo, getUserInfo });
}
