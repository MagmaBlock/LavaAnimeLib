<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

const props = defineProps<{
  anime: ReturnType<typeof useAnime>
  notice: string | null
}>()

const emit = defineEmits<{
  'open-mobile-details': []
}>()

const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greaterOrEqual("lg");
</script>

<template>
  <!-- 播放器 — Teleport 到当前断点对应的容器，只渲染一次 -->
  <Teleport :to="isDesktop ? '#player-target-pc' : '#player-target-mobile'">
    <div>
      <AnimePlayer
        v-if="props.anime.showArtPlayer"
        :active-file="props.anime.activeFile"
        :active-subtitle="props.anime.activeSubtitle"
        :subtitle-enabled="props.anime.subtitleData.enabled"
        :local-subtitle="props.anime.subtitleData.localSubtitle"
        :file-list="props.anime.fileData.fileList"
        :find-next-episode="(ep: any) => props.anime.findNextEpisode(ep)"
        :change-episode="(ep: string) => props.anime.changeEpisode(ep)"
        :report-view="(...args: any[]) => props.anime.reportView(...args as [boolean, string])"
        :resolve-file-url="(idx: number) => props.anime.resolveFileUrl(idx)"
        @player-created="(inst: any) => props.anime.artInstance = inst"
      />
      <AnimePlayerEmpty v-if="!props.anime.showArtPlayer" />
    </div>
  </Teleport>

  <!-- PC 端 Grid 布局 -->
  <div
    v-show="isDesktop"
    class="grid grid-cols-3 gap-6 w-full"
  >
    <NFlex vertical :size="16" class="col-span-2">
      <div id="player-target-pc" class="rounded-md overflow-clip"></div>
      <AnimeCardBasic>
        <div class="flex flex-col gap-2">
          <AnimeSubtitleControl
            v-model:subtitle-enabled="props.anime.subtitleData.enabled"
            :local-subtitle="props.anime.subtitleData.localSubtitle"
            :subtitle-list="props.anime.subtitleList"
            :active-subtitle-name="props.anime.activeSubtitle?.name"
            @select-subtitle="(name: string) => { props.anime.subtitleData.subtitleFileName = name; props.anime.subtitleData.enabled = true }"
            @upload-local-subtitle="(file: File) => props.anime.uploadLocalSubtitle(file)"
            @clear-local-subtitle="props.anime.clearLocalSubtitle"
          />
          <AnimePlayerActionBar
            v-model:is-file-browser-open="props.anime.isFileBrowserOpen"
            :has-active-file="!!props.anime.activeFile?.url"
            :is-no-browser="props.anime.isNoBrowser"
            :pause-player="() => props.anime.artInstance?.pause()"
            :active-file-url="props.anime.activeFile?.url"
            :active-file-name="props.anime.activeFile?.name"
            :disable-download="!!(props.anime.actualEndpoint ?? props.anime.preferredEndpoint)?.disableDownload"
            :report-view="(type: string) => props.anime.reportView(false, type)"
          />
        </div>
      </AnimeCardBasic>
      <AnimeMetaCard
        v-model:show-admin-tools="props.anime.showAdminTools"
        :la-i-d="props.anime.laID"
        :is-loading="props.anime.state.animeData.isLoading"
        :bgm-i-d="props.anime.bgmID"
        :episode-name="props.anime.getColorEgg?.episodeName"
        :anime-data="(props.anime.animeData as any)"
        :follow-label-add="props.anime.getColorEgg?.follow?.add"
        :follow-label-remove="props.anime.getColorEgg?.follow?.remove"
      />
    </NFlex>
    <NFlex vertical :size="16" class="col-span-1">
      <AnimeFileList
        :is-loading="props.anime.state.fileData.isLoading"
        :error-code="props.anime.state.fileData.errorCode"
        :file-list="props.anime.fileData.fileList"
        :episode-list="props.anime.episodeList"
        :no-episode-list="props.anime.noEpisodeList"
        :music-list="props.anime.musicList"
        :other-list="props.anime.otherList"
        :active-episode="props.anime.fileData.activeEpisode"
        :active-file-name="props.anime.activeFile?.name ?? null"
        :anime-date="props.anime.animeData?.date ?? ''"
        :asc-order="props.anime.ascOrder"
        :allow-download="!(props.anime.actualEndpoint ?? props.anime.preferredEndpoint)?.disableDownload"
        :color-egg-title="props.anime.getColorEgg?.fileList?.title"
        :episode-list-find="(ep: string) => props.anime.episodeListFind(ep)"
        :change-episode-auto-history="(ep: string) => props.anime.changeEpisodeAutoHistory(ep)"
        :select-and-play-video="(idx: number) => props.anime.selectAndPlayVideo(idx)"
        :select-and-play-music="(idx: number) => props.anime.selectAndPlayMusic(idx)"
        :open-attachment="(idx: number) => props.anime.openAttachment(idx)"
        @toggle-sort-order="props.anime.ascOrder = !props.anime.ascOrder"
      />
      <AnimeFileErrorDisplay
        :error-code="props.anime.state.fileData.errorCode"
        :error-message="props.anime.state.fileData.errorMessage"
        @retry="async () => { await props.anime.getAggregatedFileData(props.anime.laID); props.anime.autoPlay() }"
      />
      <AnimeDriveSelector
        v-model:remember-my-choice="props.anime.myDrive.rememberMyChoice"
        :drive-data="props.anime.driveData"
        :is-loading="props.anime.state.driveData.isLoading"
        :preferred-drive="props.anime.preferredDrive"
        :preferred-endpoint="props.anime.preferredEndpoint"
        :preferred-endpoint-id="props.anime.preferredEndpointId"
        :selected-endpoints="props.anime.myDrive.selectedEndpoints"
        :is-fallback="props.anime.isFallback"
        :actual-drive-name="props.anime.actualDriveName"
        :actual-endpoint-name="props.anime.actualEndpointName"
        :is-nsfw="props.anime.animeData?.type?.nsfw"
        :active-file="props.anime.activeFile"
        @select-drive="(driveId: string, epId?: number) => props.anime.setPreferredDrive(driveId, epId)"
        @select-endpoint="(epId: number) => props.anime.setPreferredEndpoint(epId)"
      />
      <AnimeNotice :notice="props.notice" />
      <AnimeRelations
        v-if="!props.anime.state.animeData.isLoading"
        :relations="props.anime.animeData?.relations"
      />
    </NFlex>
  </div>

  <!-- 移动端层叠布局 -->
  <div v-show="!isDesktop">
    <div id="player-target-mobile" class="overflow-clip sm:rounded-md"></div>
    <AnimeNotice :notice="props.notice" />
    <AnimeMetaCardMini
      :la-i-d="props.anime.laID"
      :follow-label-add="props.anime.getColorEgg?.follow?.add"
      :follow-label-remove="props.anime.getColorEgg?.follow?.remove"
      :anime-data="{ title: props.anime.animeData?.title, views: props.anime.animeData?.views, rating: props.anime.animeData?.rating, type: props.anime.animeData?.type }"
      @open-details="emit('open-mobile-details')"
    />
    <AnimeCardBasic>
      <div class="flex flex-col gap-2">
        <AnimeSubtitleControl
          v-model:subtitle-enabled="props.anime.subtitleData.enabled"
          :local-subtitle="props.anime.subtitleData.localSubtitle"
          :subtitle-list="props.anime.subtitleList"
          :active-subtitle-name="props.anime.activeSubtitle?.name"
          @select-subtitle="(name: string) => { props.anime.subtitleData.subtitleFileName = name; props.anime.subtitleData.enabled = true }"
          @upload-local-subtitle="(file: File) => props.anime.uploadLocalSubtitle(file)"
          @clear-local-subtitle="props.anime.clearLocalSubtitle"
        />
        <AnimePlayerActionBar
          v-model:is-file-browser-open="props.anime.isFileBrowserOpen"
          :has-active-file="!!props.anime.activeFile?.url"
          :is-no-browser="props.anime.isNoBrowser"
          :pause-player="() => props.anime.artInstance?.pause()"
          :active-file-url="props.anime.activeFile?.url"
          :active-file-name="props.anime.activeFile?.name"
          :disable-download="!!(props.anime.actualEndpoint ?? props.anime.preferredEndpoint)?.disableDownload"
          :report-view="(type: string) => props.anime.reportView(false, type)"
        />
      </div>
    </AnimeCardBasic>
    <AnimeFileList
      :is-loading="props.anime.state.fileData.isLoading"
      :error-code="props.anime.state.fileData.errorCode"
      :file-list="props.anime.fileData.fileList"
      :episode-list="props.anime.episodeList"
      :no-episode-list="props.anime.noEpisodeList"
      :music-list="props.anime.musicList"
      :other-list="props.anime.otherList"
      :active-episode="props.anime.fileData.activeEpisode"
      :active-file-name="props.anime.activeFile?.name ?? null"
      :anime-date="props.anime.animeData?.date ?? ''"
      :asc-order="props.anime.ascOrder"
      :allow-download="!(props.anime.actualEndpoint ?? props.anime.preferredEndpoint)?.disableDownload"
      :color-egg-title="props.anime.getColorEgg?.fileList?.title"
      :episode-list-find="(ep: string) => props.anime.episodeListFind(ep)"
      :change-episode-auto-history="(ep: string) => props.anime.changeEpisodeAutoHistory(ep)"
      :select-and-play-video="(idx: number) => props.anime.selectAndPlayVideo(idx)"
      :select-and-play-music="(idx: number) => props.anime.selectAndPlayMusic(idx)"
      :open-attachment="(idx: number) => props.anime.openAttachment(idx)"
      @toggle-sort-order="props.anime.ascOrder = !props.anime.ascOrder"
    />
    <AnimeFileErrorDisplay
      :error-code="props.anime.state.fileData.errorCode"
      :error-message="props.anime.state.fileData.errorMessage"
      @retry="async () => { await props.anime.getAggregatedFileData(props.anime.laID); props.anime.autoPlay() }"
    />
    <AnimeDriveSelector
      v-model:remember-my-choice="props.anime.myDrive.rememberMyChoice"
      :drive-data="props.anime.driveData"
      :is-loading="props.anime.state.driveData.isLoading"
      :preferred-drive="props.anime.preferredDrive"
      :preferred-endpoint="props.anime.preferredEndpoint"
      :preferred-endpoint-id="props.anime.preferredEndpointId"
      :selected-endpoints="props.anime.myDrive.selectedEndpoints"
      :is-fallback="props.anime.isFallback"
      :actual-drive-name="props.anime.actualDriveName"
      :actual-endpoint-name="props.anime.actualEndpointName"
      :is-nsfw="props.anime.animeData?.type?.nsfw"
      :active-file="props.anime.activeFile"
      @select-drive="(driveId: string, epId?: number) => props.anime.setPreferredDrive(driveId, epId)"
      @select-endpoint="(epId: number) => props.anime.setPreferredEndpoint(epId)"
    />
    <AnimeRelations
      v-if="!props.anime.state.animeData.isLoading"
      :relations="props.anime.animeData?.relations"
    />
  </div>
</template>
