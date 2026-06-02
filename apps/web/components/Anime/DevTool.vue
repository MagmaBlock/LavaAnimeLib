<template>
  <NCard size="small" :bordered="false">
    <NFlex :align="'center'">
      <AnimeMetaCardAnimeID :id="laID" />
      <NDivider vertical />
      <NuxtLink
        :to="{
          name: 'anime-la',
          params: { la: laID - 1 },
        }"
      >
        <NButton size="small" secondary> Next </NButton>
      </NuxtLink>
      <NuxtLink
        :to="{
          name: 'anime-la',
          params: { la: laID + 1 },
        }"
      >
        <NButton size="small" secondary> Previous </NButton>
      </NuxtLink>
      <NuxtLink
        :to="{
          name: 'anime-la',
          params: { la: Math.round(Math.random() * 1000) },
        }"
      >
        <NButton size="small" secondary> Random </NButton>
      </NuxtLink>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
defineProps<{
  laID: number
}>()
</script>
