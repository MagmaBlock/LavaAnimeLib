<script setup>
import { watchOnce } from "@vueuse/core";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { useMessage } from "naive-ui";

const anime = useAnime();
const message = useMessage();
const background = useBackgroundStore();

anime.notifyError = message.error;
anime.notifySuccess = message.success;
anime.notifyInfo = message.info;

const route = useRoute();
const router = useRouter();

const breakpoints = useBreakpoints(breakpointsTailwind);

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
    <DevOnly>
      <AnimeDevTool :la-i-d="anime.laID" class="sm:mb-4" />
    </DevOnly>
    <AnimeAdminTool v-model:show="anime.showAdminTools" :anime-data="{ name: anime.animeData?.name, name_cn: anime.animeData?.name_cn, index: anime.animeData?.index, infobox: anime.animeData?.infobox }" />
    <NModal
      v-model:show="anime.isFileBrowserOpen"
      preset="card"
      title="链接复制工具"
      style="max-width: 1024px"
    >
      <AnimeFileBrowser :file-list="anime.fileData.fileList" :is-loading="anime.state.fileData.isLoading" :allow-download="!anime.preferredDrive?.description?.includes('请勿下载')" :resolve-file-url="(idx) => anime.resolveFileUrl(idx)" />
    </NModal>

    <!-- 正常加载视图 -->
    <AnimePageBody
      v-if="anime.state.animeData.errorCode == null"
      :anime="anime"
      :notice="notice"
      @open-mobile-details="isMobileOpenDetails = true"
    />

    <!-- 移动端 MetaCard Drawer -->
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

    <!-- 404 -->
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
