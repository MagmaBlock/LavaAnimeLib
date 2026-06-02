<template>
  <NCollapseTransition :show="hasActiveFile">
    <AnimeNoBrowserNotice v-if="isNoBrowser" class="mb-2" />
    <NScrollbar x-scrollable>
      <div class="flex flex-nowrap flex-shrink-0 gap-1 md:gap-2">
        <AnimePlayerActionBarIcons ref="icons" v-model:is-file-browser-open="isFileBrowserOpen" :active-file-url="activeFileUrl" :active-file-name="activeFileName" :disable-download="disableDownload" :report-view="reportView">
          <template #showAll>
            <AnimePlayerActionBarIcon
              class="mr-2"
              @click="
                pausePlayer();
                moreModel = true;
              "
            >
              <i class="bi bi-three-dots"></i>
            </AnimePlayerActionBarIcon>
          </template>
        </AnimePlayerActionBarIcons>
      </div>
    </NScrollbar>
    <NModal v-model:show="moreModel" class="h-fit select-none">
      <NCard
        class="max-w-xl"
        title="全部播放器"
        :bordered="false"
        size="small"
        role="dialog"
        aria-modal="true"
      >
        <template #header-extra>
          <i
            class="bi bi-x-lg hover:text-blue-600 cursor-pointer ml-2"
            @click="moreModel = false"
          ></i>
        </template>
        <div class="flex flex-wrap gap-1 md:gap-2 mb-4">
          <AnimePlayerActionBarIcons :allos="true" v-model:is-file-browser-open="isFileBrowserOpen" :active-file-url="activeFileUrl" :active-file-name="activeFileName" :disable-download="disableDownload" :report-view="reportView" />
        </div>
        <div class="text-gray-600 dark:text-gray-400 text-xs">
          番剧库会根据您使用的设备，判断支持的外部播放器。<br />而这里是所有设备可用的播放器，它们可能不支持您的设备。<br />
        </div>
        <NuxtLink
          to="/help?article=WhyExternalPlayer"
          class="text-blue-500 text-xs block mt-2"
        >
          部分视频提示 "需要外部播放器"？
        </NuxtLink>
        <NuxtLink
          to="/help?article=ExternalPlayerList"
          class="text-blue-500 text-xs block"
        >
          可用的外部播放器列表
        </NuxtLink>
        <div class="text-gray-600 dark:text-gray-400 text-xs mt-2">
          图标绘制：Arthals
        </div>
      </NCard>
    </NModal>
  </NCollapseTransition>
</template>

<script setup lang="ts">
const isFileBrowserOpen = defineModel<boolean>('isFileBrowserOpen', { default: false })

defineProps<{
  hasActiveFile: boolean
  isNoBrowser: boolean
  pausePlayer: () => void
  activeFileUrl?: string
  activeFileName?: string
  disableDownload?: boolean
  reportView: (type: string) => void
}>()

const moreModel = ref(false);
</script>
