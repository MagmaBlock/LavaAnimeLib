<template>
  <NDrawer
    v-model:show="show"
    placement="bottom"
    :default-height="540"
    resizable
  >
    <NDrawerContent title="番剧库运营工具">
      <NList bordered>
        <NListItem>
          <NThing title="RuleName" :description="getRuleName"> </NThing>
          <template #suffix>
            <NButton @click="copy(getRuleName)"> 复制 </NButton>
          </template>
        </NListItem>
        <NListItem>
          <NThing title="Path" :description="getPath"> </NThing>
          <template #suffix>
            <NButton @click="copy(getPath)"> 复制 </NButton>
          </template>
        </NListItem>
        <NListItem v-if="animeData?.name">
          <NThing title="Name" :description="animeData.name"> </NThing>
          <template #suffix>
            <NButton @click="copy(animeData.name!)"> 复制 </NButton>
          </template>
        </NListItem>
        <NListItem v-if="animeData?.name_cn">
          <NThing title="NameCN" :description="animeData.name_cn">
          </NThing>
          <template #suffix>
            <NButton @click="copy(animeData.name_cn!)"> 复制 </NButton>
          </template>
        </NListItem>
        <NListItem v-if="getWebsite">
          <NThing title="Website"> </NThing>
          <template v-for="url in getWebsite">
            <NA target="_blank" :href="url">
              {{ url }}
            </NA>
            <br />
          </template>
        </NListItem>
      </NList>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const show = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  animeData?: {
    name?: string
    name_cn?: string
    index?: { year?: string; type?: string; name?: string }
    infobox?: any[]
  }
}>()

const { copy } = useClipboard();

const getPath = computed(() => {
  return `D:\\Downloads\\LavaAnimeLib\\${props.animeData?.index?.year}\\${props.animeData?.index?.type}\\${props.animeData?.index?.name}`;
});
const getRuleName = computed(() => {
  const typeStr = props.animeData?.index?.type ?? ''
  const match = typeStr.match(/^\d{1,2}/)
  const month = match ? match[0] : "other"
  return `【${month}】${props.animeData?.index?.name}`;
});
const getWebsite = computed(() => {
  if (!props.animeData?.infobox) return;
  let result = props.animeData?.infobox?.find((kv: { key: string; value: string }) => {
    return ["官方网站", "官网", "网站"].includes(kv.key);
  });
  if (result?.value) {
    return [
      result.value,
      result.value + (result.value.endsWith("/") ? "story" : "/story"),
      result.value + (result.value.endsWith("/") ? "episodes" : "/episodes"),
    ];
  } else return;
});
</script>
