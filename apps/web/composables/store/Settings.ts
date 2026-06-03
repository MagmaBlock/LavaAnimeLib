import { useStorage } from "@vueuse/core";

export function useSettings() {
  const darkMode = useStorage("settings", {
    enable: true,
    autoDarkMode: true,
    autoMode: "system" as "system" | "time",
    darkTime: 19,
    lightTime: 7,
  });

  function applyTimeDark() {
    if (darkMode.value.autoMode == "time" && darkMode.value.autoDarkMode) {
      const now = new Date().getHours();
      const dark = darkMode.value.darkTime;
      const light = darkMode.value.lightTime;

      if (dark >= light) {
        if (light < now && now <= dark) {
          darkMode.value.enable = false;
        }
        if (dark <= now || now < light) {
          darkMode.value.enable = true;
        }
      }
      if (dark < light) {
        if (dark < now && now <= light) {
          darkMode.value.enable = true;
        }
        if (light <= now || now < dark) {
          darkMode.value.enable = false;
        }
      }
    }
  }

  function applySystemDark(isSystemDark: boolean) {
    if (darkMode.value.autoMode == "system" && darkMode.value.autoDarkMode) {
      darkMode.value.enable = isSystemDark;
    }
  }

  return reactive({ darkMode, applyTimeDark, applySystemDark });
}
