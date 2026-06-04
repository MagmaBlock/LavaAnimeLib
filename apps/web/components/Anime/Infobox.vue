<template>
  <AnimeCardBasic v-if="hasData">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:info-outline" />
        概要信息
      </div>
    </template>
    <div class="space-y-3 max-h-96 overflow-y-auto">
      <template v-for="group in groupedItems" :key="group.key">
        <div class="border-b border-gray-100 dark:border-zinc-800 pb-2 last:border-b-0 last:pb-0">
          <div class="text-xs text-gray-400 dark:text-zinc-500 mb-1">{{ group.key }}</div>
          <div class="space-y-1">
            <template v-for="(item, idx) in group.items" :key="idx">
              <div class="flex gap-2 text-sm text-gray-700 dark:text-zinc-300">
                <span v-if="item.sub_key" class="text-gray-400 dark:text-zinc-500 shrink-0">{{ item.sub_key }}:</span>
                <span class="break-all" :class="{ 'text-blue-500 dark:text-blue-400': isUrl(item.value) }">{{ item.value }}</span>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </AnimeCardBasic>
  <AnimeCardBasic v-else-if="loading">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:info-outline" />
        概要信息
      </div>
    </template>
    <NSpace vertical :size="12">
      <NSkeleton v-for="i in 4" :key="i" :height="20" :width="200 + Math.random() * 100" />
    </NSpace>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
import type { StructuredInfoboxItem } from "@lavaanime/shared";

const props = defineProps<{
  items?: StructuredInfoboxItem[] | null
  loading?: boolean
}>();

const hasData = computed(() => props.items && props.items.length > 0);

const groupedItems = computed(() => {
  if (!props.items) return [];
  const map = new Map<string, StructuredInfoboxItem[]>();
  for (const item of props.items) {
    const existing = map.get(item.key) || [];
    existing.push(item);
    map.set(item.key, existing);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    items: items.sort((a, b) => a.sort_order - b.sort_order),
  }));
});

function isUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}
</script>
