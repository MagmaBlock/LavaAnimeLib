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
      <div class="space-y-4">
        <NFlex :wrap="false" class="items-start">
          <AnimeMetaCardPosterImage
            :poster-url="animeData?.images?.poster"
            class="hidden sm:block"
          />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="space-y-2">
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
                  <AnimeMetaCardPlatform :platform="animeData?.platform" />
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
            </div>

            <AnimeMetaCardTags
              :tags="animeData?.tags"
              :loading="isLoading"
            />

            <section v-if="summary">
              <div
                class="text-[14px] leading-7 text-gray-700 dark:text-zinc-300 whitespace-pre-line"
                :class="{ 'line-clamp-4': !summaryExpanded }"
              >
                {{ summary }}
              </div>
              <NButton
                v-if="summary.length > 180"
                text
                size="small"
                type="primary"
                class="mt-1"
                @click="summaryExpanded = !summaryExpanded"
              >
                <template #icon>
                  <Icon :name="summaryExpanded ? 'material-symbols:keyboard-arrow-up-rounded' : 'material-symbols:keyboard-arrow-down-rounded'" />
                </template>
                {{ summaryExpanded ? "收起" : "展开全文" }}
              </NButton>
            </section>

            <AnimeMetaCardExternalLinks
              :bgm-id="bgmID"
              :official-website="getWebsite"
            />
          </div>
        </NFlex>

        <AnimeInfoPanel
          :collection="animeData?.structured?.collection ?? animeData?.collection ?? null"
          :rating-counts="animeData?.structured?.rating?.counts ?? null"
          :infobox="animeData?.structured?.infobox ?? null"
          :characters="animeData?.structured?.characters ?? null"
          :episodes="animeData?.structured?.episodes ?? null"
          :active-episode="activeEpisode"
          :loading="isLoading"
        />
      </div>
    </template>
  </NCard>
</template>

<script lang="ts" setup>
import type { AnimeDetail, BangumiInfoboxItem } from "@lavaanime/shared";

const showAdminTools = defineModel<boolean>('showAdminTools', { default: false })
const summaryExpanded = ref(false);

const props = defineProps<{
  laID?: number
  followLabelAdd?: string
  followLabelRemove?: string
  isLoading?: boolean
  bgmID?: number | null
  episodeName?: string
  activeEpisode?: string | number | null
  animeData?: Partial<AnimeDetail> & {
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
    infobox?: BangumiInfoboxItem[]
  }
}>()

const getWebsite = computed(() => {
  if (!props.animeData?.infobox) return;
  const result = props.animeData.infobox.find((kv) => {
    return ["官方网站", "官网", "网站"].includes(kv.key);
  });
  if (result && typeof result.value === "string") {
    return result.value;
  }
  return;
});

const summary = computed(() => props.animeData?.summary?.trim() ?? "");
</script>

<style></style>
