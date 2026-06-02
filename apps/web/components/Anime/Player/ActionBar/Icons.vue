<template>
  <!-- 复制链接 -->
  <AnimePlayerActionBarIcon
    v-if="isSupported"
    icon="/PlayersIcon/Link.svg"
    @click="
      handleButtonClick('Copy Link');
      copy();
    "
    class="cursor-pointer relative"
  >
    <Transition name="fade">
      <div
        v-if="copied"
        class="absolute border-2 border-blue-500 inset-0 rounded-md"
      ></div>
    </Transition>
    <span v-if="!copied">复制</span>
    <span v-else>成功</span>
  </AnimePlayerActionBarIcon>
  <!-- 缓存 -->
  <AnimePlayerActionBarIcon
    v-if="!disableDownload"
    icon="/PlayersIcon/download.svg"
    :href="activeFileUrl"
    @click="handleButtonClick('Download')"
  >
    缓存
  </AnimePlayerActionBarIcon>
  <!-- 缓存 -->
  <AnimePlayerActionBarIcon
    v-if="!disableDownload"
    @click="
      () => {
        handleButtonClick('Download');
        isFileBrowserOpen = true;
      }
    "
  >
    批量缓存
  </AnimePlayerActionBarIcon>

  <!-- "显示全部" 未打开前的显示位置 -->
  <slot name="showAll"></slot>
  <!-- 弹弹Play -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/DanDanPlay.svg"
    :href="getUrl().ddplayWindows"
    @click="handleButtonClick('DanDanPlayWindows')"
    v-if="(ua.os.name ?? '') == 'Windows' || props.allos"
  >
    弹弹Play <span v-if="props.allos" class="ml-1 text-xs">(Windows)</span>
  </AnimePlayerActionBarIcon>
  <!-- 弹弹Play 安卓 -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/DanDanPlay.svg"
    :href="getUrl().ddplayAndroid"
    @click="handleButtonClick('DanDanPlayAndroid')"
    v-if="(ua.os.name ?? '').match(/Android|Android-x86|HarmonyOS/i) || props.allos"
  >
    弹弹Play <span v-if="props.allos" class="ml-1 text-xs">(Android)</span>
  </AnimePlayerActionBarIcon>
  <!-- PotPlayer -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/PotPlayer.svg"
    :href="getUrl().potplayer"
    @click="handleButtonClick('PotPlayer')"
    v-if="(ua.os.name ?? '') == 'Windows' || props.allos"
  >
    PotPlayer
  </AnimePlayerActionBarIcon>
  <!-- MPV -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/mpv.svg"
    :href="getUrl().mpv"
    @click="handleButtonClick('mpv')"
    v-if="(ua.os.name ?? '').match(/Android|Android-x86|HarmonyOS/i) || props.allos"
  >
    MPV
  </AnimePlayerActionBarIcon>
  <!-- VLC -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/vlc.svg"
    :href="getUrl().vlc"
    @click="handleButtonClick('VLC')"
  >
    VLC
  </AnimePlayerActionBarIcon>
  <!-- IINA -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/iina.svg"
    :href="getUrl().iina"
    @click="handleButtonClick('IINA')"
    v-if="(ua.os.name ?? '') == 'Mac OS' || props.allos"
  >
    IINA
  </AnimePlayerActionBarIcon>
  <!-- nPlayer -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/nplayer.svg"
    :href="getUrl().nPlayer"
    @click="handleButtonClick('nPlayer')"
    v-if="(ua.os.name ?? '').match(/Android|Android-x86|HarmonyOS|iOS/i) || props.allos"
  >
    nPlayer
  </AnimePlayerActionBarIcon>
  <!-- MXPlayer -->
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/mxplayer.svg"
    :href="getUrl().mxPlayerPro"
    @click="handleButtonClick('MXPlayer')"
    v-if="(ua.os.name ?? '').match(/Android|Android-x86|HarmonyOS/i) || props.allos"
  >
    MXPlayer Pro
  </AnimePlayerActionBarIcon>
  <AnimePlayerActionBarIcon
    icon="/PlayersIcon/mxplayer.svg"
    :href="getUrl().mxPlayer"
    @click="handleButtonClick('MXPlayer')"
    v-if="(ua.os.name ?? '').match(/Android|Android-x86|HarmonyOS/i) || props.allos"
  >
    MXPlayer
  </AnimePlayerActionBarIcon>
</template>

<script setup lang="ts">
import { useClipboard, useThrottleFn } from "@vueuse/core";
import uaParser from "ua-parser-js";

const isFileBrowserOpen = defineModel<boolean>('isFileBrowserOpen', { default: false })

const props = defineProps<{
  allos?: boolean
  activeFileUrl?: string
  activeFileName?: string
  disableDownload?: boolean
  reportView: (type: string) => void
}>()

const ua = uaParser();
const { copy, copied, isSupported } = useClipboard({
  source: computed(() => props.activeFileUrl ?? ''),
  legacy: true,
});

function handleButtonClick(type: string) {
  useThrottleFn(() => props.reportView(type), 2000)();
}

const getUrl = () => {
  const url = props.activeFileUrl ?? ''
  const name = props.activeFileName ?? ''
  return {
    ddplayWindows: `ddplay:${encodeURIComponent(url + "|filePath=" + name)}`,
    ddplayAndroid: `intent:${url}#Intent;package=com.xyoye.dandanplay;end`,
    potplayer: `potplayer://${url}`,
    vlc: `vlc://${url}`,
    iina: `iina://weblink?url=${url}`,
    mpv: `intent:${url}#Intent;package=is.xyz.mpv;end`,
    nPlayer: `nplayer-${url}`,
    mxPlayer: `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;S.title=${name};end`,
    mxPlayerPro: `intent:${url}#Intent;package=com.mxtech.videoplayer.pro;S.title=${name};end`,
  };
};
</script>
