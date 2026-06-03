export function useBackground() {
  const enable = ref(false);
  const imageUrl = ref("");
  const customClass = ref("");

  function setBackground(backgroundUrl: string, cls?: string) {
    enable.value = true;
    imageUrl.value = backgroundUrl;
    if (cls) customClass.value = cls;
  }

  function resetBackground() {
    enable.value = false;
    imageUrl.value = "";
    customClass.value = "";
  }

  function setCustomClass(cls: string) {
    customClass.value = cls;
  }

  function setEnable(isEnable: boolean) {
    enable.value = isEnable;
  }

  return reactive({ enable, imageUrl, customClass, setBackground, resetBackground, setCustomClass, setEnable });
}
