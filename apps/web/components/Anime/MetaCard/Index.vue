<template>
  <NCard size="small" :bordered="false">
    <template #header>
      <AnimeMetaCardIndexBreadcrumb
        :year="animeData?.index?.year"
        :type="animeData?.index?.type"
        :name="animeData?.index?.name"
        @open-admin-tools="showAdminTools = true"
      />
    </template>
    <template #header-extra>
      <AnimeFollowButton v-if="laID" :anime-id="laID" :follow-label-add="followLabelAdd" :follow-label-remove="followLabelRemove" />
    </template>
    <template #default>
      <NFlex :wrap="false">
        <AnimeMetaCardPosterImage
          :poster-url="animeData?.images?.poster"
          class="hidden sm:block"
        />
        <NFlex vertical>
          <NFlex :wrap="false" justify="space-between">
            <NFlex vertical>
              <NFlex :align="'baseline'">
                <AnimeMetaCardTitle
                  :title="animeData?.title"
                  :original-title="animeData?.name"
                  :loading="isLoading"
                />
                <AnimeMetaCardAttributeLabels
                  :bdrip="animeData?.type?.bdrip"
                  :nsfw="animeData?.type?.nsfw"
                />
              </NFlex>
              <AnimeMetaCardPosterImage
                :poster-url="animeData?.images?.poster"
                :mini="true"
                class="sm:hidden"
              />
              <NFlex vertical size="small">
                <NFlex class="text-gray-500">
                  <AnimeMetaCardPlatform
                    :platform="animeData?.platform"
                  />
                  <AnimeMetaCardReleaseDate :date="animeData?.date" />
                  <AnimeMetaCardTotalEpisodesCount
                    :count="animeData?.eps"
                    :episode-name="episodeName"
                  />
                </NFlex>
                <NFlex class="text-gray-500">
                  <AnimeMetaCardViewCount :views="animeData?.views" />
                  <AnimeMetaCardRating
                    :rating="animeData?.rating?.score"
                    :rank="animeData?.rating?.rank"
                  />
                  <AnimeMetaCardAnimeID :id="animeData?.id" />
                </NFlex>
              </NFlex>
            </NFlex>
          </NFlex>
          <AnimeMetaCardTags
            :tags="animeData?.tags"
            :loading="isLoading"
          />
        </NFlex>
      </NFlex>
    </template>
    <template #action>
      <AnimeMetaCardExternalLinks
        :bgm-id="bgmID"
        :official-website="getWebsite"
      />
    </template>
  </NCard>
</template>

<script lang="ts" setup>
const showAdminTools = defineModel<boolean>('showAdminTools', { default: false })

const props = defineProps<{
  laID?: number
  followLabelAdd?: string
  followLabelRemove?: string
  isLoading?: boolean
  bgmID?: number | null
  episodeName?: string
  animeData?: {
    title?: string
    name?: string
    platform?: string
    date?: string
    eps?: number
    views?: number
    id?: number
    images?: { poster?: string }
    rating?: { score?: number; rank?: number }
    type?: { bdrip?: boolean; nsfw?: boolean }
    tags?: { name: string; count: number }[]
    index?: { year?: string; type?: string; name?: string }
    infobox?: Array<{ key: string; value: string }>
  }
}>()

const getWebsite = computed(() => {
  if (!props.animeData?.infobox) return;
  const result = props.animeData.infobox.find((kv) => {
    return ["官方网站", "官网", "网站"].includes(kv.key);
  });
  return result?.value;
});
</script>

<style></style>
