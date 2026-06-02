<script setup>
import { watchOnce } from "@vueuse/core";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const store = useAnimeStore();
const background = useBackgroundStore();

const route = useRoute();
const router = useRouter();

const breakpoints = useBreakpoints(breakpointsTailwind);

const currentMobilePage = ref("play");

const refreshPlayer = async () => {
  store.showArtPlayer = false;
  await nextTick();
  store.showArtPlayer = true;
};
provide("refreshPlayer", refreshPlayer);

const buildPage = () => {
  store.buildPage(route.params.la, route.query.episode);
  watchOnce(
    () => store.state.animeData.isLoading,
    async () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth", // 平滑滚动
      });
    }
  );
};

// 监听路由来重建界面
watch(
  () => route.params.la,
  () => {
    if (route.name != "anime-la") return; // 排除退出番剧界面的路由变化
    store.$reset();
    buildPage();
  },
  { immediate: true }
);

// 集数监控更改路由查询参数
watch(
  () => store.fileData.activeEpisode,
  () => {
    if (store.fileData.activeEpisode) {
      router.replace({
        query: { ...route.query, episode: store.fileData.activeEpisode },
      });
    } else {
      router.replace({ query: { ...route.query, episode: undefined } });
    }
  }
);

// title 显示
useHead({
  title: computed(() => {
    if (store.state.animeData.isLoading) {
      return "加载中...";
    } else if (
      store.animeData?.title &&
      !store.activeFile?.parseResult?.episode
    ) {
      return `${store.animeData?.title}`;
    } else if (
      store.animeData?.title &&
      store.activeFile?.parseResult?.episode
    ) {
      return `${store.animeData?.title} 第${store.activeFile.parseResult?.episode}话`;
    }
  }),
});

/**
 * 背景图相关
 */
// 监听 poster 变化
watch(() => store.animeData?.images?.poster, refreshBackground);
// 监听断点变化
watch(breakpoints.greaterOrEqual("sm"), refreshBackground, { immediate: true });
// 刷新背景
function refreshBackground() {
  if (store.animeData?.images?.poster) {
    if (breakpoints.isGreaterOrEqual("sm") == true) {
      // 启用背景
      background.setBackground(
        store.animeData.images.poster,
        "blur-3xl opacity-50"
      );
    } else {
      background.setEnable(false);
    }
  }
}
// 监听离开界面，解除背景
onUnmounted(() => {
  background.resetBackground();
});

const isMobileOpenDetails = ref(false);

const notice = computed(() => {
  const fileList = store.fileData?.fileList;
  if (Array.isArray(fileList) && fileList.length > 0) {
    const noticeFile = fileList.find((file) => {
      return file?.name && typeof file.name === 'string' && file.name.endsWith(".notice");
    });
    if (noticeFile?.name) {
      return noticeFile.name.replace(/\.notice$/, "");
    }
  }
  return null;
});
</script>

<template>
  <ContainerPageMobileFull>
    <!-- 开发模式视图 -->
    <DevOnly>
      <AnimeDevTool :la-i-d="store.laID" class="sm:mb-4" />
    </DevOnly>
    <!-- (模态框等) DOM 位置无关组件 -->
    <AnimeAdminTool v-model:show="store.showAdminTools" :anime-data="{ name: store.animeData?.name, name_cn: store.animeData?.name_cn, index: store.animeData?.index, infobox: store.animeData?.infobox }" />
    <!-- 文件浏览器模态框 -->
    <NModal
      v-model:show="store.isFileBrowserOpen"
      preset="card"
      title="链接复制工具"
      style="max-width: 1024px"
    >
      <AnimeFileBrowser :file-list="store.fileData.fileList" :is-loading="store.state.fileData.isLoading" :allow-download="!store.preferredDrive?.description?.includes('请勿下载')" :resolve-file-url="(idx) => store.resolveFileUrl(idx)" />
    </NModal>
    <!-- PC 端主视图，Grid 布局，仅在 lg 以上可用 -->
    <div
      class="grid grid-cols-3 gap-6 w-full"
      v-if="
        store.state.animeData.errorCode == null &&
        breakpoints.greaterOrEqual('lg').value
      "
    >
      <!-- 左视图 占两列 -->
      <NFlex vertical :size="16" class="col-span-2">
        <!-- 视频框 -->
        <div class="rounded-md overflow-clip">
          <AnimePlayer v-if="store.showArtPlayer" :active-file="store.activeFile" :active-subtitle="store.activeSubtitle" :subtitle-enabled="store.subtitleData.enabled" :local-subtitle="store.subtitleData.localSubtitle" :file-list="store.fileData.fileList" :find-next-episode="(ep) => store.findNextEpisode(ep)" :change-episode="(ep) => store.changeEpisode(ep)" :report-view="(...args) => store.reportView(...args)" :resolve-file-url="(idx) => store.resolveFileUrl(idx)" @player-created="(inst) => store.artInstance = inst" />
          <AnimePlayerEmpty v-if="!store.showArtPlayer" />
        </div>
        <!-- 本地播放器调用 -->
        <AnimeCardBasic>
          <div class="flex flex-col gap-2">
            <AnimeSubtitleControl v-model:subtitle-enabled="store.subtitleData.enabled" :local-subtitle="store.subtitleData.localSubtitle" :subtitle-list="store.subtitleList" :active-subtitle-name="store.activeSubtitle?.name" @select-subtitle="(name) => { store.subtitleData.subtitleFileName = name; store.subtitleData.enabled = true }" @upload-local-subtitle="(file) => store.uploadLocalSubtitle(file)" @clear-local-subtitle="store.clearLocalSubtitle" />
            <AnimePlayerActionBar v-model:is-file-browser-open="store.isFileBrowserOpen" :has-active-file="!!store.activeFile?.url" :is-no-browser="store.isNoBrowser" :pause-player="() => store.artInstance?.pause()" :active-file-url="store.activeFile?.url" :active-file-name="store.activeFile?.name" :disable-download="!!(store.actualEndpoint ?? store.preferredEndpoint)?.disableDownload" :report-view="(type) => store.reportView(false, type)" />
          </div>
        </AnimeCardBasic>
        <!-- 番剧卡 -->
        <AnimeMetaCard v-model:show-admin-tools="store.showAdminTools" :la-i-d="store.laID" :is-loading="store.state.animeData.isLoading" :bgm-i-d="store.bgmID" :episode-name="store.getColorEgg?.episodeName" :anime-data="store.animeData" :follow-label-add="store.getColorEgg?.follow?.add" :follow-label-remove="store.getColorEgg?.follow?.remove" />
      </NFlex>
      <!-- 右视图 占一列 -->
      <NFlex vertical :size="16" class="col-span-1">
        <AnimeFileList :is-loading="store.state.fileData.isLoading" :error-code="store.state.fileData.errorCode" :file-list="store.fileData.fileList" :episode-list="store.episodeList" :no-episode-list="store.noEpisodeList" :music-list="store.musicList" :other-list="store.otherList" :active-episode="store.fileData.activeEpisode" :active-file-name="store.activeFile?.name" :anime-date="store.animeData?.date ?? ''" :asc-order="store.ascOrder" :allow-download="!(store.actualEndpoint ?? store.preferredEndpoint)?.disableDownload" :color-egg-title="store.getColorEgg?.fileList?.title" :episode-list-find="(ep) => store.episodeListFind(ep)" :change-episode-auto-history="(ep) => store.changeEpisodeAutoHistory(ep)" :select-and-play-video="(idx) => store.selectAndPlayVideo(idx)" :select-and-play-music="(idx) => store.selectAndPlayMusic(idx)" :open-attachment="(idx) => store.openAttachment(idx)" @toggle-sort-order="store.ascOrder = !store.ascOrder" />
        <AnimeFileErrorDisplay :error-code="store.state.fileData.errorCode" :error-message="store.state.fileData.errorMessage" @retry="async () => { await store.getAggregatedFileData(store.laID); store.autoPlay() }" />
        <AnimeDriveSelector v-model:remember-my-choice="store.myDrive.rememberMyChoice" :drive-data="store.driveData" :is-loading="store.state.driveData.isLoading" :preferred-drive="store.preferredDrive" :preferred-endpoint="store.preferredEndpoint" :preferred-endpoint-id="store.preferredEndpointId" :selected-endpoints="store.myDrive.selectedEndpoints" :is-fallback="store.isFallback" :actual-drive-name="store.actualDriveName" :actual-endpoint-name="store.actualEndpointName" :is-nsfw="store.animeData?.type?.nsfw" :active-file="store.activeFile" @select-drive="(driveId, epId) => store.setPreferredDrive(driveId, epId)" @select-endpoint="(epId) => store.setPreferredEndpoint(epId)" />
        <!-- 番剧公告（V2）临时 -->
        <AnimeNotice :notice="notice" />
        <!-- 关联作品 -->
        <AnimeRelations v-if="!store.state.animeData.isLoading" :relations="store.animeData?.relations" />
      </NFlex>
    </div>
    <!-- 移动端主视图 -->
    <div
      v-if="
        store.state.animeData.errorCode == null &&
        breakpoints.smaller('lg').value
      "
    >
      <!-- 视频框 -->
      <div class="overflow-clip sm:rounded-md">
        <AnimePlayer v-if="store.showArtPlayer" :active-file="store.activeFile" :active-subtitle="store.activeSubtitle" :subtitle-enabled="store.subtitleData.enabled" :local-subtitle="store.subtitleData.localSubtitle" :file-list="store.fileData.fileList" :find-next-episode="(ep) => store.findNextEpisode(ep)" :change-episode="(ep) => store.changeEpisode(ep)" :report-view="(...args) => store.reportView(...args)" :resolve-file-url="(idx) => store.resolveFileUrl(idx)" @player-created="(inst) => store.artInstance = inst" />
        <AnimePlayerEmpty v-if="!store.showArtPlayer" />
      </div>

      <AnimeNotice :notice="notice" />
      <AnimeMetaCardMini :la-i-d="store.laID" :follow-label-add="store.getColorEgg?.follow?.add" :follow-label-remove="store.getColorEgg?.follow?.remove" :anime-data="{ title: store.animeData?.title, views: store.animeData?.views, rating: store.animeData?.rating, type: store.animeData?.type }" @open-details="isMobileOpenDetails = true" />
      <NDrawer
        v-model:show="isMobileOpenDetails"
        :default-height="502"
        placement="bottom"
        resizable
      >
        <NDrawerContent
          :closable="true"
          title="详情"
          body-content-style="padding: 0px;"
        >
          <AnimeMetaCard v-model:show-admin-tools="store.showAdminTools" :la-i-d="store.laID" :is-loading="store.state.animeData.isLoading" :bgm-i-d="store.bgmID" :episode-name="store.getColorEgg?.episodeName" :anime-data="store.animeData" :follow-label-add="store.getColorEgg?.follow?.add" :follow-label-remove="store.getColorEgg?.follow?.remove" />
        </NDrawerContent>
      </NDrawer>
      <AnimeCardBasic>
        <div class="flex flex-col gap-2">
          <AnimeSubtitleControl v-model:subtitle-enabled="store.subtitleData.enabled" :local-subtitle="store.subtitleData.localSubtitle" :subtitle-list="store.subtitleList" :active-subtitle-name="store.activeSubtitle?.name" @select-subtitle="(name) => { store.subtitleData.subtitleFileName = name; store.subtitleData.enabled = true }" @upload-local-subtitle="(file) => store.uploadLocalSubtitle(file)" @clear-local-subtitle="store.clearLocalSubtitle" />
          <AnimePlayerActionBar v-model:is-file-browser-open="store.isFileBrowserOpen" :has-active-file="!!store.activeFile?.url" :is-no-browser="store.isNoBrowser" :pause-player="() => store.artInstance?.pause()" :active-file-url="store.activeFile?.url" :active-file-name="store.activeFile?.name" :disable-download="!!(store.actualEndpoint ?? store.preferredEndpoint)?.disableDownload" :report-view="(type) => store.reportView(false, type)" />
        </div>
      </AnimeCardBasic>
      <AnimeFileList :is-loading="store.state.fileData.isLoading" :error-code="store.state.fileData.errorCode" :file-list="store.fileData.fileList" :episode-list="store.episodeList" :no-episode-list="store.noEpisodeList" :music-list="store.musicList" :other-list="store.otherList" :active-episode="store.fileData.activeEpisode" :active-file-name="store.activeFile?.name" :anime-date="store.animeData?.date ?? ''" :asc-order="store.ascOrder" :allow-download="!(store.actualEndpoint ?? store.preferredEndpoint)?.disableDownload" :color-egg-title="store.getColorEgg?.fileList?.title" :episode-list-find="(ep) => store.episodeListFind(ep)" :change-episode-auto-history="(ep) => store.changeEpisodeAutoHistory(ep)" :select-and-play-video="(idx) => store.selectAndPlayVideo(idx)" :select-and-play-music="(idx) => store.selectAndPlayMusic(idx)" :open-attachment="(idx) => store.openAttachment(idx)" @toggle-sort-order="store.ascOrder = !store.ascOrder" />
      <AnimeFileErrorDisplay :error-code="store.state.fileData.errorCode" :error-message="store.state.fileData.errorMessage" @retry="async () => { await store.getAggregatedFileData(store.laID); store.autoPlay() }" />
      <AnimeDriveSelector v-model:remember-my-choice="store.myDrive.rememberMyChoice" :drive-data="store.driveData" :is-loading="store.state.driveData.isLoading" :preferred-drive="store.preferredDrive" :preferred-endpoint="store.preferredEndpoint" :preferred-endpoint-id="store.preferredEndpointId" :selected-endpoints="store.myDrive.selectedEndpoints" :is-fallback="store.isFallback" :actual-drive-name="store.actualDriveName" :actual-endpoint-name="store.actualEndpointName" :is-nsfw="store.animeData?.type?.nsfw" :active-file="store.activeFile" @select-drive="(driveId, epId) => store.setPreferredDrive(driveId, epId)" @select-endpoint="(epId) => store.setPreferredEndpoint(epId)" />
      <!-- 关联作品 -->
      <AnimeRelations v-if="!store.state.animeData.isLoading" :relations="store.animeData?.relations" />
    </div>

    <!-- 错误处理视图 -->
    <div
      v-if="store.state.animeData.errorCode == 404"
      class="w-full grid place-content-center mt-16"
    >
      <NResult
        status="404"
        title="404 资源不存在"
        :description="store.state.animeData.errorMessage ?? '未知错误'"
        class="w-fit p-10 rounded-md"
      />
    </div>
  </ContainerPageMobileFull>
</template>
