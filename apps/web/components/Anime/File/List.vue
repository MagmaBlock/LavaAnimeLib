<script setup lang="ts">
import type { FileData } from "~/composables/store/Anime";
import { useBytesToSize } from "~/composables/bytesToSize";

interface EpisodeGroup {
  episode: string
  list: FileData
}

const props = defineProps<{
  isLoading: boolean
  errorCode: number | null
  fileList: FileData
  episodeList: EpisodeGroup[]
  noEpisodeList: FileData
  musicList: FileData
  otherList: FileData
  activeEpisode: string | null
  activeFileName: string | null
  animeDate: string
  ascOrder: boolean
  allowDownload: boolean
  colorEggTitle?: string

  // 回调
  episodeListFind: (episode: string) => EpisodeGroup | undefined
  changeEpisodeAutoHistory: (episode: string) => Promise<void>
  selectAndPlayVideo: (fileIndex: number) => Promise<void>
  selectAndPlayMusic: (fileIndex: number) => Promise<void>
  openAttachment: (fileIndex: number) => Promise<void>
}>()

const emit = defineEmits<{
  'toggle-sort-order': []
}>()

function getFileIndex(file: FileData[number]): number {
  return props.fileList.indexOf(file)
}
</script>
<template>
  <div>
    <AnimeFileListLoading v-if="isLoading" />

    <AnimeCardBasic
      v-if="!isLoading && !errorCode && fileList.length"
    >
      <template #header>
        <div class="flex place-items-center" @click="emit('toggle-sort-order')">
          <div>{{ colorEggTitle ?? "播放列表" }}</div>
          <div class="flex-1"></div>
          <Icon name="mdi:sort-ascending" size="16" v-if="ascOrder" />
          <Icon name="mdi:sort-descending" size="16" v-else />
        </div>
      </template>
      <NTabs type="bar" size="small" animated>
        <NTabPane name="正片" tab="正片" v-if="episodeList.length">
          <div class="grid grid-cols-6 gap-1">
            <NPopover
              trigger="hover"
              :disabled="episode.list.length == 1"
              v-for="episode in episodeList"
            >
              <template #trigger>
                <AnimeCardButton
                  class="relative h-10 grid content-center"
                  :active="activeEpisode == episode.episode"
                  @click="changeEpisodeAutoHistory(episode.episode)"
                >
                  <div class="leading-none pb-0.5 text-center">
                    {{ episode.episode }}
                  </div>
                  <div
                    v-if="episode.list.length > 1"
                    class="absolute h-0.5 w-1.5 mx-auto inset-x-0 bottom-1 rounded"
                    :class="
                      activeEpisode == episode.episode
                        ? 'bg-gray-50'
                        : 'bg-gray-400'
                    "
                  ></div>
                </AnimeCardButton>
              </template>
              <span>当前集数有 {{ episode.list.length }} 个视频</span>
            </NPopover>
          </div>
          <NCollapseTransition :show="!!activeEpisode">
            <div class="my-1">
              <Transition mode="out-in" name="fade">
                <div :key="activeEpisode ?? ''">
                  <AnimeFileInfo
                    v-for="video in episodeListFind(activeEpisode!)?.list"
                    :video="video"
                    @click="selectAndPlayVideo(getFileIndex(video))"
                    :active="video.name == activeFileName"
                  />
                </div>
              </Transition>
            </div>
          </NCollapseTransition>
        </NTabPane>

        <NTabPane
          name="无集数视频"
          :tab="
            episodeList.length
              ? `相关视频 (${noEpisodeList.length})`
              : `视频 (${noEpisodeList.length})`
          "
          v-if="noEpisodeList.length"
        >
          <AnimeFileInfo
            v-for="video in noEpisodeList"
            :video="video"
            @click="selectAndPlayVideo(getFileIndex(video))"
            :active="video.name == activeFileName"
          />
        </NTabPane>

        <NTabPane
          name="音乐"
          :tab="`音乐 (${musicList.length})`"
          v-if="musicList.length"
        >
          <AnimeFileInfo
            :video="file"
            @click="selectAndPlayMusic(getFileIndex(file))"
            :active="file.name == activeFileName"
            v-for="file in musicList"
          />
        </NTabPane>

        <NTabPane
          name="附件"
          :tab="`附件 (${otherList.length})`"
          v-if="otherList.length"
        >
          <NPopover trigger="hover" v-for="file in otherList">
            <template #trigger>
              <a
                v-if="allowDownload"
                href="javascript:void(0)"
                @click="openAttachment(getFileIndex(file))"
                rel="noopener noreferrer"
              >
                <AnimeFileInfo :video="file" />
              </a>
              <AnimeFileInfo v-else :video="file" />
            </template>
            <span>
              这是一个 {{ file?.parseResult?.extensionName?.result }} 附件, 大小
              {{ useBytesToSize(file?.size) }}{{ allowDownload ? ", 点击可以下载" : "" }}
            </span>
          </NPopover>
        </NTabPane>
      </NTabs>
    </AnimeCardBasic>

    <AnimeCardBasic
      v-if="!isLoading && !errorCode && !fileList.length"
      class="py-6"
    >
      <NResult status="418" title="暂无文件" size="small" />
      <div class="text-center">
        <div class="text-base my-1">可能原因</div>
        <ul>
          <li>1. 所有存储节点均不包含此动画</li>
          <li>
            2. 当前动画暂无资源或未放送，根据 Bangumi，开播时间为
            {{ animeDate || "未知 / 暂未定档" }}
          </li>
        </ul>
      </div>
    </AnimeCardBasic>
  </div>
</template>
