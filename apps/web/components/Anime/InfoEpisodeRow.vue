<template>
  <div
    class="grid grid-cols-[3rem_1fr] gap-3 py-2.5 text-sm"
    :class="active ? 'rounded-md bg-blue-50/70 dark:bg-blue-950/20' : ''"
  >
    <span
      class="pt-0.5 font-mono text-xs font-semibold tabular-nums"
      :class="active ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-zinc-500'"
    >
      {{ episode.ep != null ? fmtEp(episode.ep) : fmtSort(episode.sort) }}
    </span>
    <div class="min-w-0">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="truncate font-medium"
          :class="active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-zinc-200'"
        >
          {{ episode.name_cn || episode.name || "--" }}
        </span>
        <NTag v-if="episode.type === 1" size="tiny" :bordered="false" type="warning">SP</NTag>
        <NTag v-else-if="episode.type === 2" size="tiny" :bordered="false" type="info">OP</NTag>
        <NTag v-else-if="episode.type === 3" size="tiny" :bordered="false" type="info">ED</NTag>
      </div>
      <div class="mt-0.5 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 dark:text-zinc-500">
        <span v-if="episode.name_cn && episode.name" class="truncate">{{ episode.name }}</span>
        <span v-if="episode.airdate">{{ episode.airdate }}</span>
        <span v-if="episode.duration">{{ episode.duration }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StructuredEpisode } from "@lavaanime/shared";

defineProps<{
  episode: StructuredEpisode
  active?: boolean
}>();

function fmtEp(ep: number): string {
  return String(ep).padStart(2, "0");
}

function fmtSort(sort: number): string {
  return sort === Math.floor(sort) ? String(sort).padStart(2, "0") : sort.toFixed(1);
}
</script>
