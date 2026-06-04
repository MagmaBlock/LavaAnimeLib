<template>
  <AnimeCardBasic v-if="hasData">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:list-alt-outline" />
        剧集列表
      </div>
    </template>
    <div class="max-h-96 overflow-y-auto">
      <NFold
        v-for="ep in displayEpisodes"
        :key="ep.id"
        :id="`ep-${ep.id}`"
        class="border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
      >
        <template #header>
          <div class="flex items-center gap-2 py-1 text-sm">
            <span class="text-gray-400 dark:text-zinc-500 font-mono w-10 shrink-0">
              {{ ep.ep != null ? formatEp(ep.ep) : formatSort(ep.sort) }}
            </span>
            <span class="text-gray-700 dark:text-zinc-200 truncate">{{ ep.name_cn || ep.name || '--' }}</span>
            <NTag v-if="ep.type === 1" size="tiny" :bordered="false" type="warning">SP</NTag>
            <NTag v-else-if="ep.type === 2" size="tiny" :bordered="false" type="info">OP</NTag>
            <NTag v-else-if="ep.type === 3" size="tiny" :bordered="false" type="info">ED</NTag>
          </div>
        </template>
        <div class="pl-12 pb-2 space-y-1 text-xs text-gray-400 dark:text-zinc-500">
          <div v-if="ep.name && ep.name_cn" class="text-gray-500 dark:text-zinc-400">{{ ep.name }}</div>
          <div v-if="ep.airdate">首播: {{ ep.airdate }}</div>
          <div v-if="ep.duration">时长: {{ ep.duration }}</div>
          <div v-if="ep.desc" class="text-gray-500 dark:text-zinc-400 line-clamp-2">{{ ep.desc }}</div>
          <div v-if="ep.status && ep.status !== 'Air'">{{ ep.status }}</div>
        </div>
      </NFold>
    </div>
  </AnimeCardBasic>
  <AnimeCardBasic v-else-if="loading">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:list-alt-outline" />
        剧集列表
      </div>
    </template>
    <NSpace vertical :size="8">
      <NSkeleton v-for="i in 8" :key="i" :height="28" width="100%" />
    </NSpace>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
import type { StructuredEpisode } from "@lavaanime/shared";
import NFold from "./Card/Flod.vue";

const props = defineProps<{
  episodes?: StructuredEpisode[] | null
  loading?: boolean
}>();

const hasData = computed(() => props.episodes && props.episodes.length > 0);

const displayEpisodes = computed(() => {
  if (!props.episodes) return [];
  return [...props.episodes].sort((a, b) => a.sort - b.sort);
});

function formatEp(ep: number): string {
  return String(ep).padStart(2, '0');
}

function formatSort(sort: number): string {
  if (sort === Math.floor(sort)) return String(sort).padStart(2, '0');
  return sort.toFixed(1);
}
</script>
