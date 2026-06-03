<script setup>
import { watchOnce } from "@vueuse/core";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const anime = useAnime();
const background = useBackgroundStore();

const route = useRoute();
const router = useRouter();

const breakpoints = useBreakpoints(breakpointsTailwind);

const currentMobilePage = ref("play");

const refreshPlayer = async () => {
  anime.showArtPlayer = false;
  await nextTick();
  anime.showArtPlayer = true;
};
provide("refreshPlayer", refreshPlayer);

const buildPage = () => {
  anime.buildPage(route.params.la, route.query.episode);
  watchOnce(
    () => anime.state.animeData.isLoading,
    async () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  );
};

// 监听路由来重建界面
watch(
  () => route.params.la,
  () => {
    if (route.name != "anime-la") return;
    anime.$reset();
    buildPage();
  },
  { immediate: true }
);

// 集数监控更改路由查询参数
watch(
  () => anime.fileData.activeEpisode,
  () => {
    if (anime.fileData.activeEpisode) {
      router.replace({
        query: { ...route.query, episode: anime.fileData.activeEpisode },
      });
    } else {
      router.replace({ query: { ...route.query, episode: undefined } });
    }
  }
);

// title 显示
useHead({
  title: computed(() => {
    if (anime.state.animeData.isLoading) {
      return "加载中...";
    } else if (
      anime.animeData?.title &&
      !anime.activeFile?.parseResult?.episode
    ) {
      return `${anime.animeData?.title}`;
    } else if (
      anime.animeData?.title &&
      anime.activeFile?.parseResult?.episode
    ) {
      return `${anime.animeData?.title} 第${anime.activeFile.parseResult?.episode}话`;
    }
  }),
});

/**
 * 背景图相关
 */
// 监听 poster 变化
watch(() => anime.animeData?.images?.poster, refreshBackground);
// 监听断点变化
watch(breakpoints.greaterOrEqual("sm"), refreshBackground, { immediate: true });
// 刷新背景
function refreshBackground() {
  if (anime.animeData?.images?.poster) {
    if (breakpoints.isGreaterOrEqual("sm") == true) {
      // 启用背景
      background.setBackground(
        anime.animeData.images.poster,
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
  const fileList = anime.fileData?.fileList;
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
      <AnimeDevTool :la-i-d="anime.laID" class="sm:mb-4" />
    </DevOnly>
    <!-- (模态框等) DOM 位置无关组件 -->
    <AnimeAdminTool v-model:show="anime.showAdminTools" :anime-data="{ name: anime.animeData?.name, name_cn: anime.animeData?.name_cn, index: anime.animeData?.index, infobox: anime.animeData?.infobox }" />
    <!-- 文件浏览器模态框 -->
    <NModal
      v-model:show="anime.isFileBrowserOpen"
      preset="card"
      title="链接复制工具"
      style="max-width: 1024px"
    >
      <AnimeFileBrowser :file-list="anime.fileData.fileList" :is-loading="anime.state.fileData.isLoading" :allow-download="!anime.preferredDrive?.description?.includes('请勿下载')" :resolve-file-url="(idx) => anime.resolveFileUrl(idx)" />
    </NModal>
    <!-- PC 端主视图，Grid 布局，仅在 lg 以上可用 -->
    <div
      class="grid grid-cols-3 gap-6 w-full"
      v-if="
        anime.state.animeData.errorCode == null &&
        breakpoints.greaterOrEqual('lg').value
      "
    >
      <!-- 左视图 占两列 -->
      <NFlex vertical :size="16" class="col-span-2">
        <!-- 视频框 -->
        <div class="rounded-md overflow-clip">
          <AnimePlayer v-if="anime.showArtPlayer" :active-file="anime.activeFile" :active-subtitle="anime.activeSubtitle" :subtitle-enabled="anime.subtitleData.enabled" :local-subtitle="anime.subtitleData.localSubtitle" :file-list="anime.fileData.fileList" :find-next-episode="(ep) => anime.findNextEpisode(ep)" :change-episode="(ep) => anime.changeEpisode(ep)" :report-view="(...args) => anime.reportView(...args)" :resolve-file-url="(idx) => anime.resolveFileUrl(idx)" @player-created="(inst) => anime.artInstance = inst" />
          <AnimePlayerEmpty v-if="!anime.showArtPlayer" />
        </div>
        <!-- 本地播放器调用 -->
        <AnimeCardBasic>
          <div class="flex flex-col gap-2">
            <AnimeSubtitleControl v-model:subtitle-enabled="anime.subtitleData.enabled" :local-subtitle="anime.subtitleData.localSubtitle" :subtitle-list="anime.subtitleList" :active-subtitle-name="anime.activeSubtitle?.name" @select-subtitle="(name) => { anime.subtitleData.subtitleFileName = name; anime.subtitleData.enabled = true }" @upload-local-subtitle="(file) => anime.uploadLocalSubtitle(file)" @clear-local-subtitle="anime.clearLocalSubtitle" />
            <AnimePlayerActionBar v-model:is-file-browser-open="anime.isFileBrowserOpen" :has-active-file="!!anime.activeFile?.url" :is-no-browser="anime.isNoBrowser" :pause-player="() => anime.artInstance?.pause()" :active-file-url="anime.activeFile?.url" :active-file-name="anime.activeFile?.name" :disable-download="!!(anime.actualEndpoint ?? anime.preferredEndpoint)?.disableDownload" :report-view="(type) => anime.reportView(false, type)" />
          </div>
        </AnimeCardBasic>
        <!-- 番剧卡 -->
        <AnimeMetaCard v-model:show-admin-tools="anime.showAdminTools" :la-i-d="anime.laID" :is-loading="anime.state.animeData.isLoading" :bgm-i-d="anime.bgmID" :episode-name="anime.getColorEgg?.episodeName" :anime-data="anime.animeData" :follow-label-add="anime.getColorEgg?.follow?.add" :follow-label-remove="anime.getColorEgg?.follow?.remove" />
      </NFlex>
      <!-- 右视图 占一列 -->
      <NFlex vertical :size="16" class="col-span-1">
        <AnimeFileList :is-loading="anime.state.fileData.isLoading" :error-code="anime.state.fileData.errorCode" :file-list="anime.fileData.fileList" :episode-list="anime.episodeList" :no-episode-list="anime.noEpisodeList" :music-list="anime.musicList" :other-list="anime.otherList" :active-episode="anime.fileData.activeEpisode" :active-file-name="anime.activeFile?.name" :anime-date="anime.animeData?.date ?? ''" :asc-order="anime.ascOrder" :allow-download="!(anime.actualEndpoint ?? anime.preferredEndpoint)?.disableDownload" :color-egg-title="anime.getColorEgg?.fileList?.title" :episode-list-find="(ep) => anime.episodeListFind(ep)" :change-episode-auto-history="(ep) => anime.changeEpisodeAutoHistory(ep)" :select-and-play-video="(idx) => anime.selectAndPlayVideo(idx)" :select-and-play-music="(idx) => anime.selectAndPlayMusic(idx)" :open-attachment="(idx) => anime.openAttachment(idx)" @toggle-sort-order="anime.ascOrder = !anime.ascOrder" />
        <AnimeFileErrorDisplay :error-code="anime.state.fileData.errorCode" :error-message="anime.state.fileData.errorMessage" @retry="async () => { await anime.getAggregatedFileData(anime.laID); anime.autoPlay() }" />
        <AnimeDriveSelector v-model:remember-my-choice="anime.myDrive.rememberMyChoice" :drive-data="anime.driveData" :is-loading="anime.state.driveData.isLoading" :preferred-drive="anime.preferredDrive" :preferred-endpoint="anime.preferredEndpoint" :preferred-endpoint-id="anime.preferredEndpointId" :selected-endpoints="anime.myDrive.selectedEndpoints" :is-fallback="anime.isFallback" :actual-drive-name="anime.actualDriveName" :actual-endpoint-name="anime.actualEndpointName" :is-nsfw="anime.animeData?.type?.nsfw" :active-file="anime.activeFile" @select-drive="(driveId, epId) => anime.setPreferredDrive(driveId, epId)" @select-endpoint="(epId) => anime.setPreferredEndpoint(epId)" />
        <!-- 番剧公告（V2）临时 -->
        <AnimeNotice :notice="notice" />
        <!-- 关联作品 -->
        <AnimeRelations v-if="!anime.state.animeData.isLoading" :relations="anime.animeData?.relations" />
      </NFlex>
    </div>
    <!-- 移动端主视图 -->
    <div
      v-if="
        anime.state.animeData.errorCode == null &&
        breakpoints.smaller('lg').value
      "
    >
      <!-- 视频框 -->
      <div class="overflow-clip sm:rounded-md">
        <AnimePlayer v-if="anime.showArtPlayer" :active-file="anime.activeFile" :active-subtitle="anime.activeSubtitle" :subtitle-enabled="anime.subtitleData.enabled" :local-subtitle="anime.subtitleData.localSubtitle" :file-list="anime.fileData.fileList" :find-next-episode="(ep) => anime.findNextEpisode(ep)" :change-episode="(ep) => anime.changeEpisode(ep)" :report-view="(...args) => anime.reportView(...args)" :resolve-file-url="(idx) => anime.resolveFileUrl(idx)" @player-created="(inst) => anime.artInstance = inst" />
        <AnimePlayerEmpty v-if="!anime.showArtPlayer" />
      </div>

      <AnimeNotice :notice="notice" />
      <AnimeMetaCardMini :la-i-d="anime.laID" :follow-label-add="anime.getColorEgg?.follow?.add" :follow-label-remove="anime.getColorEgg?.follow?.remove" :anime-data="{ title: anime.animeData?.title, views: anime.animeData?.views, rating: anime.animeData?.rating, type: anime.animeData?.type }" @open-details="isMobileOpenDetails = true" />
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
          <AnimeMetaCard v-model:show-admin-tools="anime.showAdminTools" :la-i-d="anime.laID" :is-loading="anime.state.animeData.isLoading" :bgm-i-d="anime.bgmID" :episode-name="anime.getColorEgg?.episodeName" :anime-data="anime.animeData" :follow-label-add="anime.getColorEgg?.follow?.add" :follow-label-remove="anime.getColorEgg?.follow?.remove" />
        </NDrawerContent>
      </NDrawer>
      <AnimeCardBasic>
        <div class="flex flex-col gap-2">
          <AnimeSubtitleControl v-model:subtitle-enabled="anime.subtitleData.enabled" :local-subtitle="anime.subtitleData.localSubtitle" :subtitle-list="anime.subtitleList" :active-subtitle-name="anime.activeSubtitle?.name" @select-subtitle="(name) => { anime.subtitleData.subtitleFileName = name; anime.subtitleData.enabled = true }" @upload-local-subtitle="(file) => anime.uploadLocalSubtitle(file)" @clear-local-subtitle="anime.clearLocalSubtitle" />
          <AnimePlayerActionBar v-model:is-file-browser-open="anime.isFileBrowserOpen" :has-active-file="!!anime.activeFile?.url" :is-no-browser="anime.isNoBrowser" :pause-player="() => anime.artInstance?.pause()" :active-file-url="anime.activeFile?.url" :active-file-name="anime.activeFile?.name" :disable-download="!!(anime.actualEndpoint ?? anime.preferredEndpoint)?.disableDownload" :report-view="(type) => anime.reportView(false, type)" />
        </div>
      </AnimeCardBasic>
      <AnimeFileList :is-loading="anime.state.fileData.isLoading" :error-code="anime.state.fileData.errorCode" :file-list="anime.fileData.fileList" :episode-list="anime.episodeList" :no-episode-list="anime.noEpisodeList" :music-list="anime.musicList" :other-list="anime.otherList" :active-episode="anime.fileData.activeEpisode" :active-file-name="anime.activeFile?.name" :anime-date="anime.animeData?.date ?? ''" :asc-order="anime.ascOrder" :allow-download="!(anime.actualEndpoint ?? anime.preferredEndpoint)?.disableDownload" :color-egg-title="anime.getColorEgg?.fileList?.title" :episode-list-find="(ep) => anime.episodeListFind(ep)" :change-episode-auto-history="(ep) => anime.changeEpisodeAutoHistory(ep)" :select-and-play-video="(idx) => anime.selectAndPlayVideo(idx)" :select-and-play-music="(idx) => anime.selectAndPlayMusic(idx)" :open-attachment="(idx) => anime.openAttachment(idx)" @toggle-sort-order="anime.ascOrder = !anime.ascOrder" />
      <AnimeFileErrorDisplay :error-code="anime.state.fileData.errorCode" :error-message="anime.state.fileData.errorMessage" @retry="async () => { await anime.getAggregatedFileData(anime.laID); anime.autoPlay() }" />
      <AnimeDriveSelector v-model:remember-my-choice="anime.myDrive.rememberMyChoice" :drive-data="anime.driveData" :is-loading="anime.state.driveData.isLoading" :preferred-drive="anime.preferredDrive" :preferred-endpoint="anime.preferredEndpoint" :preferred-endpoint-id="anime.preferredEndpointId" :selected-endpoints="anime.myDrive.selectedEndpoints" :is-fallback="anime.isFallback" :actual-drive-name="anime.actualDriveName" :actual-endpoint-name="anime.actualEndpointName" :is-nsfw="anime.animeData?.type?.nsfw" :active-file="anime.activeFile" @select-drive="(driveId, epId) => anime.setPreferredDrive(driveId, epId)" @select-endpoint="(epId) => anime.setPreferredEndpoint(epId)" />
      <!-- 关联作品 -->
      <AnimeRelations v-if="!anime.state.animeData.isLoading" :relations="anime.animeData?.relations" />
    </div>

    <!-- 错误处理视图 -->
    <div
      v-if="anime.state.animeData.errorCode == 404"
      class="w-full grid place-content-center mt-16"
    >
      <NResult
        status="404"
        title="404 资源不存在"
        :description="anime.state.animeData.errorMessage ?? '未知错误'"
        class="w-fit p-10 rounded-md"
      />
    </div>
  </ContainerPageMobileFull>
</template>
