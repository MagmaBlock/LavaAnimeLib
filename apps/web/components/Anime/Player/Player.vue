<template>
  <div
    class="relative w-full aspect-w-16 aspect-h-9 bg-black overflow-hidden select-none"
  >
    <div
      id="artContainer"
      class="absolute top-0 w-full h-full select-none"
    ></div>
  </div>
</template>

<script setup lang="ts">
import Artplayer from "artplayer";
import SubtitlesOctopus from "libass-wasm/dist/js/subtitles-octopus.js";
import { useLocalStorage, useThrottleFn, watchDebounced } from "@vueuse/core";
import type { FileData, ParseResult } from "~/composables/anime";

const props = defineProps<{
  activeFile?: (FileData[number] & { parseResult: ParseResult }) | null
  activeSubtitle?: any | null
  subtitleEnabled?: boolean
  localSubtitle?: { name: string; content: string; type: string } | null
  fileList?: FileData

  findNextEpisode: (ep?: string) => string | undefined
  changeEpisode: (ep: string) => Promise<string | undefined>
  reportView: (isWebPlayer: boolean, watchMethod: string) => Promise<void>
  resolveFileUrl: (index: number) => Promise<string>
}>()

const emit = defineEmits<{
  'player-created': [instance: any]
}>()

const message = useMessage();
const notification = useNotification();
const refreshPlayer = inject("refreshPlayer") as () => Promise<void>;
const route = useRoute();

const rememberRate = useLocalStorage("rememberRate", false);

let subtitleInstance: any = null;

const createSubtitles = async (subtitleFile: any) => {
  let content: string;

  if (props.localSubtitle && subtitleFile.name === props.localSubtitle.name) {
    content = props.localSubtitle.content;
  } else {
    let url = subtitleFile.url;
    if (!url) {
      const index = props.fileList?.indexOf(subtitleFile) ?? -1;
      if (index === -1) throw new Error("字幕文件未找到");
      url = await props.resolveFileUrl(index);
    }
    content = await fetch(url).then((res) => res.text());
  }

  const assContent = subtitleFile.name.match(/.srt$/i)
    ? srtToAss(content)
    : content;

  subtitleInstance = new SubtitlesOctopus({
    video: artInstance.video,
    subContent: assContent,
    workerUrl: "/libass-wasm/subtitles-octopus-worker.js",
    fallbackFont: "/libass-wasm/default.woff2",
    canvasStyle: {
      willReadFrequently: true,
    },
    width: 1280,
    height: 720,
    debug: true,
    targetFps: 24,
    renderMode: "wasm-blend",
    onError: function (error: any) {
      console.error("Subtitle Error:", error);
    },
  });
};

const disposeSubtitles = () => {
  if (subtitleInstance) {
    subtitleInstance.dispose();
    subtitleInstance = null;
    const canvas = document.querySelector<HTMLCanvasElement>("#artContainer canvas");
    if (canvas) {
      canvas.style.display = "none";
    }
  }
};

watch(
  () => props.activeSubtitle,
  (subtitleFile) => {
    if (subtitleFile) {
      disposeSubtitles();
      createSubtitles(subtitleFile);
    } else {
      disposeSubtitles();
    }
  }
);

watch(
  () => props.subtitleEnabled,
  (enabled) => {
    if (!enabled) {
      disposeSubtitles();
    } else if (props.activeSubtitle) {
      disposeSubtitles();
      createSubtitles(props.activeSubtitle);
    }
  }
);

let artInstance: any;

onMounted(() => {
  const options = {
    autoMini: true,
    autoplay: true,
    theme: "#2563eb",
    hotkey: true,
    volume: 1,
    pip: true,
    mutex: true,
    fullscreen: true,
    fullscreenWeb: true,
    lock: true,
    autoOrientation: true,
    airplay: true,
    fastForward: true,
    container: "#artContainer",
    setting: true,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    settings: [
      {
        html: "记住播放倍速",
        tooltip: rememberRate.value ? "记住" : "关闭",
        switch: rememberRate.value,
        onSwitch: function (item: any) {
          const nextState = !item.switch;
          rememberRate.value = nextState;
          item.tooltip = nextState ? "记住" : "关闭";
          return nextState;
        },
      },
    ],
    controls: [
      {
        name: "next",
        index: 20,
        position: "left",
        html: '<i class="art-icon" style="display: flex;width: 26px;height: 26px;margin-top: 1px"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z" fill="currentColor"></path></svg></i>',
        tooltip: "下一话",
        click: useThrottleFn(function () {
          const newEp = props.findNextEpisode();
          if (newEp) {
            props.changeEpisode(newEp).catch((err: any) => {
              console.error("切换集数失败:", err);
            });
          }
        }, 1000),
      },
    ],
  };

  artInstance = reactive(new Artplayer(options as any));
  emit('player-created', artInstance);

  watchDebounced(
    () => props.activeFile,
    async (newFile) => {
      if (!newFile?.url) return;

      try {
        await artInstance.switchUrl(newFile?.url);
      } catch (error) {
        message.error("播放失败, 正在重试");
      }

      if (newFile?.parseResult?.extensionName?.type == "music") {
        message.info(`正在播放音乐 ${newFile?.name}`);
      }
    },
    { immediate: true, debounce: 500 }
  );

  artInstance.on("error", (error: any, reconnectTime: number) => {
    console.log(error, reconnectTime);
    if (reconnectTime == 5) {
      refreshPlayer();
      message.error("无法连接到此播放节点，请尝试换一个节点或检查网络", {
        duration: 10000,
      });
    }
  });

  const reportPlaying = () => {
    if (
      !artInstance?.duration ||
      props.activeFile?.parseResult?.extensionName?.type != "video"
    ) {
      return;
    }
    if (route.query?.noReport) {
      console.log("由于路由含 noReport 参数，不会进行播放历史上报");
      return;
    }

    props.reportView(true, "WebPlayer");
  };

  artInstance.on("video:timeupdate", useThrottleFn(reportPlaying, 8000));
  artInstance.on("seek", useThrottleFn(reportPlaying, 3000));
  artInstance.on("video:ended", reportPlaying);

  artInstance.on("ready", () => {
    setTimeout(async () => {
      const count = usePageLifeCycle().getClickCount();
      if (count > 0) {
        artInstance.play();
      } else {
        artInstance.muted = true;
        artInstance.play();

        notification.create({
          type: "info",
          title: "静音播放",
          description: "因浏览器限制，本次自动播放为静音，关闭此消息恢复。",
          onClose: () => {
            artInstance.muted = false;
          },
          duration: 10000,
        });
      }
    }, 200);
  });

  artInstance.on("video:ratechange", (e: any) => {
    const rate = e.target?.playbackRate;
    if (typeof rate == "number") {
      localStorage.setItem("playbackRate", String(rate));
    }
  });

  artInstance.on("video:canplaythrough", () => {
    const rate = localStorage.getItem("playbackRate");
    if (typeof rate == "string" && rememberRate.value) {
      artInstance.video.playbackRate = JSON.parse(rate);
    }
  });

  watch(
    () => props.activeFile,
    () => {
      artInstance.controls.update({
        ...options.controls[0],
        disable: !props.findNextEpisode(),
      });
    },
    { immediate: true }
  );

  artInstance.on(
    "video:timeupdate",
    useThrottleFn(() => {
      if (artInstance.duration < 20 || !props.findNextEpisode()) return;
      const endingTime = artInstance.duration - artInstance.currentTime;
      if (endingTime <= 10) {
        artInstance.notice.show = `将在 ${Math.round(
          endingTime
        )} 秒后播放下一话`;
      }
    }, 1000)
  );

  artInstance.on("video:ended", () => {
    const nextEp = props.findNextEpisode();
    if (nextEp) props.changeEpisode(nextEp);
  });

  onBeforeUnmount(() => {
    artInstance.destroy();
  });
});
</script>

<style>
/* 播放器控制器调整更浅的背景，同时增大底边距, */
.art-video-player > .art-bottom {
  padding-bottom: 10px !important;
  background-image: linear-gradient(#0000, #0006, #0008) !important;
}
/* 为移动端播放器增加左右间距  */
.art-mobile > .art-bottom > .art-controls {
  padding-right: 10px !important;
  padding-left: 10px !important;
}

/* 字幕画布样式 */
#artContainer canvas {
  z-index: 20;
  pointer-events: none;
}
</style>
