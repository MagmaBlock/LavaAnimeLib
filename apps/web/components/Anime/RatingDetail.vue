<template>
  <AnimeCardBasic v-if="hasData">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:bar-chart-rounded" />
        评分分布
      </div>
    </template>
    <NSpace vertical :size="4" class="w-full">
      <div v-for="entry in countWithPercent" :key="entry.star" class="flex items-center gap-2 text-sm">
        <span class="w-8 text-right text-gray-500 dark:text-zinc-400 shrink-0">{{ entry.star }}星</span>
        <div class="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: entry.percent + '%', backgroundColor: barColor(entry.star) }"
          />
        </div>
        <span class="w-10 text-right text-xs text-gray-400 dark:text-zinc-500 shrink-0">{{ entry.count }}</span>
      </div>
    </NSpace>
    <div v-if="totalCount" class="mt-2 text-xs text-gray-400 dark:text-zinc-500 text-right">
      共 {{ totalCount }} 人评分
    </div>
  </AnimeCardBasic>
  <AnimeCardBasic v-else-if="loading">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:bar-chart-rounded" />
        评分分布
      </div>
    </template>
    <NSpace vertical :size="8">
      <NSkeleton v-for="i in 10" :key="i" :height="12" width="100%" />
    </NSpace>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
const props = defineProps<{
  counts?: Array<{ star: number; count: number }> | null
  loading?: boolean
}>();

const hasData = computed(() => props.counts && props.counts.length > 0);

const sortedCounts = computed(() => {
  if (!props.counts) return [];
  return [...props.counts].sort((a, b) => b.star - a.star);
});

const totalCount = computed(() => {
  return props.counts?.reduce((sum, c) => sum + c.count, 0) ?? 0;
});

const maxCount = computed(() => {
  return Math.max(...(props.counts?.map((c) => c.count) ?? [0]), 1);
});

function barColor(star: number): string {
  if (star >= 9) return '#f59e0b';
  if (star >= 7) return '#84cc16';
  if (star >= 5) return '#06b6d4';
  return '#94a3b8';
}

const countWithPercent = computed(() => {
  return sortedCounts.value.map((c) => ({
    ...c,
    percent: maxCount.value > 0 ? (c.count / maxCount.value) * 100 : 0,
  }));
});
</script>
