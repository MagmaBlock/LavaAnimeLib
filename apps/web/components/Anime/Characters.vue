<template>
  <AnimeCardBasic v-if="hasData">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:group-outline" />
        角色
      </div>
    </template>
    <NFold
      v-for="(char, idx) in displayChars"
      :key="idx"
      :id="`char-${idx}`"
      class="border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
    >
      <template #header>
        <div class="flex items-center gap-3 py-2">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden shrink-0">
            <img
              v-if="char.images?.grid"
              :src="char.images.grid"
              :alt="char.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <Icon icon="material-symbols:person" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate">
              {{ char.name }}
              <span v-if="char.name_cn" class="text-gray-400 dark:text-zinc-500 ml-1">{{ char.name_cn }}</span>
            </div>
            <div class="text-xs text-gray-400 dark:text-zinc-500">{{ char.relation }}</div>
          </div>
        </div>
      </template>
      <div v-if="char.actors && char.actors.length > 0" class="pl-13 pb-2 space-y-1">
        <div
          v-for="(actor, aIdx) in char.actors"
          :key="aIdx"
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"
        >
          <Icon icon="material-symbols:mic-outline" class="shrink-0" />
          <span>{{ actor.name }}</span>
          <NTag v-for="career in actor.careers" :key="career" size="tiny" :bordered="false">
            {{ career }}
          </NTag>
        </div>
      </div>
    </NFold>
  </AnimeCardBasic>
  <AnimeCardBasic v-else-if="loading">
    <template #header>
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
        <Icon icon="material-symbols:group-outline" />
        角色
      </div>
    </template>
    <NSpace vertical :size="12">
      <NSkeleton v-for="i in 5" :key="i" :height="48" width="100%" />
    </NSpace>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
import type { StructuredCharacter } from "@lavaanime/shared";
import NFold from "./Card/Flod.vue";

const props = defineProps<{
  characters?: StructuredCharacter[] | null
  loading?: boolean
}>();

const hasData = computed(() => props.characters && props.characters.length > 0);
const displayChars = computed(() => props.characters ?? []);
</script>
