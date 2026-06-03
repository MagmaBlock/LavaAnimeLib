export function useIndex() {
  const activityCard = ref({
    enable: false,
    link: {
      enable: false,
      url: "",
    },
    image: "",
  });

  async function getActivity() {
    try {
      const data = await api.get("/v2/site/setting/get", {
        params: { key: "indexActivityCard" },
        noCatch: true,
      } as any);
      activityCard.value = data.data?.data;
    } catch (error) {}
  }

  return reactive({ activityCard, getActivity });
}
