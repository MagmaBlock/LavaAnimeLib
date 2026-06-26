<template>
  <ContainerPage>
    <template #head>
      <NavBarTopNav />
    </template>

    <main class="mx-auto w-full max-w-5xl px-4 py-6">
      <template v-if="loading">
        <div class="flex gap-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <NSkeleton :width="112" :height="112" />
          <div class="flex-1 space-y-3">
            <NSkeleton :width="240" :height="28" />
            <NSkeleton :width="360" :height="16" />
            <NSkeleton :width="'100%'" :height="48" />
          </div>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <NSkeleton v-for="i in 4" :key="i" :height="118" />
        </div>
      </template>

      <template v-else-if="character">
        <section class="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="shrink-0">
              <img
                v-if="heroImage"
                :src="heroImage"
                :alt="character.name_cn || character.name"
                class="max-h-80 max-w-full rounded-md object-contain"
              />
              <div v-else class="flex h-28 w-28 items-center justify-center rounded-md bg-gray-200 text-gray-400 dark:bg-zinc-700">
                <Icon name="material-symbols:person" size="36" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="truncate text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ character.name_cn || character.name }}
                </h1>
                <NTag size="small" :bordered="false">角色</NTag>
              </div>
              <div v-if="character.name_cn && character.name" class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {{ character.name }}
              </div>
              <p
                v-if="character.summary"
                class="mt-3 text-sm leading-7 text-gray-700 dark:text-zinc-300"
                :class="{ 'line-clamp-4': !summaryExpanded }"
              >
                {{ character.summary }}
              </p>
              <NButton
                v-if="character.summary && character.summary.length > 160"
                text
                size="small"
                type="primary"
                class="mt-2"
                @click="summaryExpanded = !summaryExpanded"
              >
                {{ summaryExpanded ? "收起" : "展开简介" }}
              </NButton>
            </div>
          </div>
        </section>

        <section class="mt-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
              <Icon name="material-symbols:movie-outline-rounded" />
              参演作品
            </h2>
            <span class="text-xs text-gray-400 dark:text-zinc-500">{{ character.subjects.length }} 部</span>
          </div>

          <div v-if="character.subjects.length" class="grid gap-3 md:grid-cols-2">
            <article
              v-for="sub in character.subjects"
              :key="`${sub.bgmid}-${sub.relation}`"
              class="flex min-w-0 gap-3 rounded-md bg-white/70 p-3 ring-1 ring-gray-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
            >
              <Component
                :is="sub.anime_id ? NuxtLink : 'a'"
                v-bind="subjectLinkAttrs(sub)"
                class="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-zinc-700"
              >
                <img
                  v-if="sub.poster"
                  :src="sub.poster"
                  :alt="sub.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                  <Icon name="material-symbols:movie-outline" size="24" />
                </div>
              </Component>

              <div class="min-w-0 flex-1">
                <Component
                  :is="sub.anime_id ? NuxtLink : 'a'"
                  v-bind="subjectLinkAttrs(sub)"
                  class="line-clamp-2 text-sm font-semibold text-gray-800 transition-colors hover:text-blue-500 dark:text-zinc-100 dark:hover:text-blue-400"
                >
                  {{ sub.name_cn || sub.name }}
                </Component>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <NTag v-if="sub.relation" size="tiny" :bordered="false">{{ sub.relation }}</NTag>
                  <NTag v-if="!sub.anime_id" size="tiny" :bordered="false" type="warning">未入库</NTag>
                </div>
                <div v-if="sub.actors.length" class="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  <NuxtLink
                    v-for="actor in sub.actors"
                    :key="actor.id"
                    :to="`/bangumi-wiki/person/${actor.id}`"
                    class="inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400"
                  >
                    <Icon name="material-symbols:mic-outline-rounded" size="13" />
                    {{ actor.name }}
                  </NuxtLink>
                </div>
              </div>
            </article>
          </div>
          <NEmpty v-else description="暂无参演作品" />
        </section>
      </template>

      <NResult v-else status="404" title="角色不存在" class="mt-16" />
    </main>
  </ContainerPage>
</template>

<script setup lang="ts">
import type { BangumiWikiCharacterResult } from "@lavaanime/shared";

type Subject = BangumiWikiCharacterResult["subjects"][number];

const route = useRoute();
const NuxtLink = resolveComponent("NuxtLink");
const character = ref<BangumiWikiCharacterResult | null>(null);
const loading = ref(true);
const summaryExpanded = ref(false);
const id = computed(() => Number.parseInt(String(route.params.id), 10));
const heroImage = computed(() => character.value?.images?.large || character.value?.images?.medium || character.value?.images?.grid || "");

useHead({
  title: computed(() => character.value ? `${character.value.name_cn || character.value.name} - 角色详情` : "角色详情"),
});

onMounted(async () => {
  if (!Number.isFinite(id.value)) {
    loading.value = false;
    return;
  }

  try {
    const res = await api.get(`/v2/bangumi-wiki/character/${id.value}`);
    if (res.data?.code === 200) character.value = res.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function subjectLinkAttrs(sub: Subject) {
  if (sub.anime_id) return { to: `/anime/${sub.anime_id}` };
  return {
    href: `https://bgm.tv/subject/${sub.bgmid}`,
    target: "_blank",
    rel: "noreferrer",
  };
}
</script>
