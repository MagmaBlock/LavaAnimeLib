<template>
  <ContainerPage>
    <template #head>
      <NavBarTopNav />
    </template>

    <main class="mx-auto w-full max-w-5xl px-4 py-6">
      <template v-if="loading">
        <div class="flex gap-4 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <NSkeleton :width="112" :height="112" :circle="true" />
          <div class="flex-1 space-y-3">
            <NSkeleton :width="220" :height="28" />
            <NSkeleton :width="300" :height="22" />
            <NSkeleton :width="'100%'" :height="48" />
          </div>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <NSkeleton v-for="i in 6" :key="i" :height="108" />
        </div>
      </template>

      <template v-else-if="person">
        <section class="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
              <img
                v-if="heroImage"
                :src="heroImage"
                :alt="person.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                <Icon name="material-symbols:mic-outline" size="36" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h1 class="truncate text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ person.name }}
              </h1>
              <div v-if="person.careers.length" class="mt-2 flex flex-wrap gap-1.5">
                <NTag v-for="career in person.careers" :key="career" size="small" :bordered="false">
                  {{ career }}
                </NTag>
              </div>
              <p
                v-if="person.short_summary"
                class="mt-3 text-sm leading-7 text-gray-700 dark:text-zinc-300"
                :class="{ 'line-clamp-4': !summaryExpanded }"
              >
                {{ person.short_summary }}
              </p>
              <NButton
                v-if="person.short_summary && person.short_summary.length > 160"
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
              <Icon name="material-symbols:record-voice-over-outline-rounded" />
              配音角色
            </h2>
            <span class="text-xs text-gray-400 dark:text-zinc-500">{{ person.characters.length }} 项</span>
          </div>

          <div v-if="person.characters.length" class="grid gap-3 md:grid-cols-2">
            <article
              v-for="ch in person.characters"
              :key="`${ch.character_id}-${ch.subject?.bgmid ?? 'none'}-${ch.relation ?? ''}`"
              class="flex min-w-0 gap-3 rounded-md bg-white/70 p-3 ring-1 ring-gray-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
            >
              <NuxtLink
                :to="`/bangumi-wiki/character/${ch.character_id}`"
                class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-zinc-700"
              >
                <img
                  v-if="characterImage(ch.images)"
                  :src="characterImage(ch.images)"
                  :alt="ch.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
                  <Icon name="material-symbols:person" size="22" />
                </div>
              </NuxtLink>

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                  <NuxtLink
                    :to="`/bangumi-wiki/character/${ch.character_id}`"
                    class="truncate text-sm font-semibold text-gray-800 transition-colors hover:text-blue-500 dark:text-zinc-100 dark:hover:text-blue-400"
                  >
                    {{ ch.name_cn || ch.name }}
                  </NuxtLink>
                  <NTag v-if="ch.relation" size="tiny" :bordered="false">{{ ch.relation }}</NTag>
                </div>
                <div v-if="ch.name_cn && ch.name" class="mt-0.5 truncate text-xs text-gray-400 dark:text-zinc-500">
                  {{ ch.name }}
                </div>

                <div v-if="ch.subject" class="mt-3 flex min-w-0 items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                  <Icon name="material-symbols:movie-outline-rounded" size="14" class="shrink-0" />
                  <Component
                    :is="ch.subject.anime_id ? NuxtLink : 'a'"
                    v-bind="subjectLinkAttrs(ch.subject)"
                    class="truncate transition-colors hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    {{ ch.subject.name_cn || ch.subject.name }}
                  </Component>
                  <NTag v-if="!ch.subject.anime_id" size="tiny" :bordered="false" type="warning">未入库</NTag>
                </div>
              </div>
            </article>
          </div>
          <NEmpty v-else description="暂无配音角色" />
        </section>
      </template>

      <NResult v-else status="404" title="人物不存在" class="mt-16" />
    </main>
  </ContainerPage>
</template>

<script setup lang="ts">
import type { BangumiWikiPersonResult, StructuredImages } from "@lavaanime/shared";

type Subject = NonNullable<BangumiWikiPersonResult["characters"][number]["subject"]>;

const route = useRoute();
const NuxtLink = resolveComponent("NuxtLink");
const person = ref<BangumiWikiPersonResult | null>(null);
const loading = ref(true);
const summaryExpanded = ref(false);
const id = computed(() => Number.parseInt(String(route.params.id), 10));
const heroImage = computed(() => person.value?.images?.large || person.value?.images?.medium || person.value?.images?.grid || "");

useHead({
  title: computed(() => person.value ? `${person.value.name} - 人物详情` : "人物详情"),
});

onMounted(async () => {
  if (!Number.isFinite(id.value)) {
    loading.value = false;
    return;
  }

  try {
    const res = await api.get(`/v2/bangumi-wiki/person/${id.value}`);
    if (res.data?.code === 200) person.value = res.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function subjectLinkAttrs(subject: Subject) {
  if (subject.anime_id) return { to: `/anime/${subject.anime_id}` };
  return {
    href: `https://bgm.tv/subject/${subject.bgmid}`,
    target: "_blank",
    rel: "noreferrer",
  };
}

function characterImage(images: StructuredImages | null) {
  return images?.medium || images?.grid || images?.small || "";
}
</script>
