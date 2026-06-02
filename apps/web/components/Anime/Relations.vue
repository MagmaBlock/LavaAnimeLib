<template>
  <AnimeCardBasic
    class="select-none"
    v-if="relations && relations[0]"
  >
    <template #header>
      <div
        class="flex place-items-center"
        @click="relationGrid = !relationGrid"
      >
        <div>相关作品</div>
        <div class="flex-1"></div>
        <Transition class="cursor-pointer" name="fade" mode="out-in">
          <Icon name="material-symbols:grid-on" size="16" v-if="relationGrid" />
          <Icon name="material-symbols:grid-off" size="16" v-else />
        </Transition>
      </div>
    </template>

    <!-- 新版 Grid 展示 -->
    <NCollapseTransition :show="relationGrid">
      <ContainerAnimeCard :animes="relations" size="small" />
    </NCollapseTransition>
    <!-- 旧版展示 -->
    <NCollapseTransition :show="!relationGrid">
      <div
        v-for="anime in relations"
        class="flex flex-wrap gap-1 my-2"
      >
        <NuxtLink
          :to="{
            name: 'anime-la',
            params: {
              la: anime.id,
            },
          }"
        >
          <AnimeCardButton class="px-3 py-2">
            <span
              class="bg-blue-100 text-blue-600 dark:bg-blue-600 dark:bg-opacity-60 dark:text-white text-xs font-medium rounded px-1.5 mr-1"
            >
              {{ anime.relation }}
            </span>
            <span class="text-xs">
              {{ anime.title }}
            </span>
            <span
              v-if="anime.type.bdrip"
              class="bg-blue-100 text-xs text-blue-600 font-medium rounded px-1.5 mx-0.5"
            >
              BDRip
            </span>
            <span
              v-if="anime.type.nsfw"
              class="bg-yellow-100 text-xs text-yellow-600 font-medium rounded px-1.5 mx-0.5"
            >
              NSFW
            </span>
          </AnimeCardButton>
        </NuxtLink>
      </div>
    </NCollapseTransition>
  </AnimeCardBasic>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";

const props = defineProps<{
  relations?: Array<{
    id: number
    title: string
    relation: string
    type: { bdrip: boolean; nsfw: boolean }
  }>
}>()

const relationGrid = useStorage("relationGrid", true);
</script>
