<template>
  <AnimeCardBasic>
    <NFlex vertical>
      <!-- 标题和追番 -->
      <NFlex justify="space-between" :wrap="false">
        <NFlex :align="'baseline'" @click="emits('open-details')">
          <AnimeMetaCardTitle :title="animeData?.title" />
        </NFlex>
        <AnimeFollowButton v-if="laID" :anime-id="laID" :follow-label-add="followLabelAdd" :follow-label-remove="followLabelRemove" />
      </NFlex>
      <!-- 基础信息行 -->
      <NFlex vertical size="small" @click="emits('open-details')">
        <NFlex justify="space-between">
          <NFlex class="text-gray-500">
            <AnimeMetaCardViewCount :views="animeData?.views" />
            <AnimeMetaCardRating
              :rating="animeData?.rating?.score"
              :rank="animeData?.rating?.rank"
            />
            <AnimeMetaCardAttributeLabels
              :bdrip="animeData?.type?.bdrip"
              :nsfw="animeData?.type?.nsfw"
            />
          </NFlex>
          <AnimeMetaCardDetailsButton />
        </NFlex>
      </NFlex>
    </NFlex>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
defineProps<{
  laID?: number
  followLabelAdd?: string
  followLabelRemove?: string
  animeData?: {
    title?: string
    views?: number
    rating?: { score?: number; rank?: number }
    type?: { bdrip?: boolean; nsfw?: boolean }
  }
}>()

const emits = defineEmits(["open-details"]);
</script>

<style></style>
