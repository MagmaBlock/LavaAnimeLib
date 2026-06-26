<template>
  <div
    v-if="loading || hasAnyData"
    class="border-t border-gray-100 pt-3 dark:border-zinc-800"
  >
    <div class="space-y-3">
      <template v-if="loading">
        <NSpace vertical :size="12">
          <NSkeleton :height="36" width="100%" />
          <NSkeleton :height="120" width="100%" />
          <NSkeleton :height="80" width="100%" />
        </NSpace>
      </template>

      <NTabs
        v-else
        v-model:value="activeTab"
        type="line"
        size="small"
        animated
      >
      <NTabPane name="overview" tab="概览">
        <div class="space-y-4">
          <div
            v-if="statItems.length || ratingRows.length"
            class="grid gap-4 xl:grid-cols-[minmax(22rem,1.15fr)_minmax(18rem,0.85fr)]"
          >
            <section v-if="ratingRows.length">
              <div class="mb-2 flex items-center justify-between text-xs text-gray-400 dark:text-zinc-500">
                <span>评分分布</span>
                <span v-if="ratingTotal">共 {{ fmt(ratingTotal) }} 人评分</span>
              </div>
              <div class="space-y-2">
                <div v-for="entry in ratingRows" :key="entry.star" class="grid grid-cols-[2.5rem_1fr_3rem] items-center gap-2 text-sm">
                  <span class="text-right text-xs font-medium text-gray-500 dark:text-zinc-400">{{ entry.star }}星</span>
                  <div class="h-2.5 overflow-hidden rounded-full bg-gray-200/70 dark:bg-zinc-800">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :style="{ width: entry.percent + '%', backgroundColor: barColor(entry.star) }"
                    />
                  </div>
                  <span class="text-right text-xs tabular-nums text-gray-400 dark:text-zinc-500">{{ entry.count }}</span>
                </div>
              </div>
            </section>

            <section v-if="statItems.length">
              <div class="mb-2 text-xs text-gray-400 dark:text-zinc-500">收藏统计</div>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                <div
                  v-for="item in statItems"
                  :key="item.key"
                  class="rounded-md bg-white/70 px-3 py-2 ring-1 ring-gray-100 dark:bg-zinc-950/40 dark:ring-zinc-800"
                >
                  <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                    <Icon :name="item.icon" :class="item.iconClass" />
                    <span>{{ item.label }}</span>
                  </div>
                  <div class="mt-1 text-base font-semibold leading-none text-gray-800 dark:text-zinc-100">
                    {{ fmt(item.value) }}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </NTabPane>

      <NTabPane name="staff" tab="资料">
        <div v-if="featuredInfo.length" class="grid gap-x-6 gap-y-4 md:grid-cols-2">
          <div
            v-for="group in featuredInfo"
            :key="group.key"
            class="min-w-0 border-b border-gray-100 pb-3 dark:border-zinc-800"
          >
            <div class="mb-1.5 text-xs font-medium text-gray-400 dark:text-zinc-500">{{ group.key }}</div>
            <div class="space-y-1">
              <div v-for="(item, idx) in group.items" :key="idx" class="flex gap-2 text-sm leading-6 text-gray-700 dark:text-zinc-300">
                <span v-if="item.sub_key" class="shrink-0 text-gray-400 dark:text-zinc-500">{{ item.sub_key }}</span>
                <a
                  v-if="isUrl(item.value)"
                  :href="item.value"
                  target="_blank"
                  rel="noreferrer"
                  class="min-w-0 break-all text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400"
                >
                  {{ item.value }}
                </a>
                <span v-else class="min-w-0 break-words">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <NEmpty v-else description="暂无制作信息" />
      </NTabPane>

      <NTabPane name="characters" tab="角色">
        <div v-if="characterCount" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="text-xs text-gray-400 dark:text-zinc-500">
              优先展示主要角色，其余名单已收折
            </div>
            <NButton v-if="hiddenCharacterCount > 0" size="tiny" secondary @click="showAllCharacters = true">
              全部 {{ characterCount }}
            </NButton>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <AnimeInfoCharacterCard
              v-for="char in primaryCharacters"
              :key="char.id"
              :char="char"
              compact-actors
            />
          </div>
        </div>
        <NEmpty v-else description="暂无角色信息" />
      </NTabPane>

      <NTabPane name="episodes" tab="剧集">
        <NScrollbar v-if="episodeCount" :style="{ maxHeight: '28rem' }">
          <div class="divide-y divide-gray-100 dark:divide-zinc-800">
          <AnimeInfoEpisodeRow
            v-for="ep in displayEpisodes"
            :key="ep.id"
            :episode="ep"
            :active="isActiveEpisode(ep)"
          />
          </div>
        </NScrollbar>
        <NEmpty v-else description="暂无剧集信息" />
      </NTabPane>
    </NTabs>

    <NDrawer v-model:show="showAllCharacters" :width="720" placement="right">
      <NDrawerContent title="角色与声优" closable>
        <div class="grid gap-3 sm:grid-cols-2">
          <AnimeInfoCharacterCard
            v-for="char in sortedCharacters"
            :key="char.id"
            :char="char"
          />
        </div>
      </NDrawerContent>
      </NDrawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StructuredCharacter, StructuredEpisode, StructuredInfoboxItem } from "@lavaanime/shared";

const props = defineProps<{
  collection?: { wish: number; collect: number; doing: number; on_hold: number; dropped: number } | null
  ratingCounts?: Array<{ star: number; count: number }> | null
  infobox?: StructuredInfoboxItem[] | null
  characters?: StructuredCharacter[] | null
  episodes?: StructuredEpisode[] | null
  activeEpisode?: string | number | null
  loading?: boolean
}>();

const activeTab = ref("overview");
const showAllCharacters = ref(false);

const hasAnyData = computed(() => {
  return statItems.value.length > 0
    || ratingRows.value.length > 0
    || infoboxCount.value > 0
    || characterCount.value > 0
    || episodeCount.value > 0;
});

const statItems = computed(() => {
  const c = props.collection;
  if (!c) return [];
  const items = [
    { key: "wish", label: "想看", value: c.wish, icon: "material-symbols:bookmark-add-outline-rounded", iconClass: "text-emerald-500" },
    { key: "doing", label: "在看", value: c.doing, icon: "material-symbols:play-circle-outline-rounded", iconClass: "text-amber-500" },
    { key: "collect", label: "看过", value: c.collect, icon: "material-symbols:check-circle-outline-rounded", iconClass: "text-sky-500" },
    { key: "on_hold", label: "搁置", value: c.on_hold, icon: "material-symbols:pause-circle-outline-rounded", iconClass: "text-zinc-400" },
    { key: "dropped", label: "抛弃", value: c.dropped, icon: "material-symbols:cancel-outline-rounded", iconClass: "text-rose-400" },
  ];
  return items.filter((item) => item.value > 0);
});

const ratingTotal = computed(() => props.ratingCounts?.reduce((sum, c) => sum + c.count, 0) ?? 0);
const ratingMax = computed(() => Math.max(...(props.ratingCounts?.map((c) => c.count) ?? [0]), 1));
const ratingRows = computed(() => {
  return [...(props.ratingCounts ?? [])]
    .sort((a, b) => b.star - a.star)
    .map((entry) => ({
      ...entry,
      percent: ratingMax.value > 0 ? (entry.count / ratingMax.value) * 100 : 0,
    }));
});

const groupedInfo = computed(() => {
  const map = new Map<string, StructuredInfoboxItem[]>();
  for (const item of props.infobox ?? []) {
    const existing = map.get(item.key) ?? [];
    existing.push(item);
    map.set(item.key, existing);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    items: [...items].sort((a, b) => a.sort_order - b.sort_order),
  }));
});

const featuredInfo = computed(() => groupedInfo.value);
const infoboxCount = computed(() => props.infobox?.length ?? 0);

const relationPriority = new Map([
  ["主角", 0],
  ["main", 0],
  ["主演", 0],
  ["配角", 1],
  ["supporting", 1],
  ["客串", 2],
  ["闲角", 3],
]);

const sortedCharacters = computed(() => {
  return [...(props.characters ?? [])].sort((a, b) => {
    const pa = relationPriority.get(a.relation) ?? 2;
    const pb = relationPriority.get(b.relation) ?? 2;
    if (pa !== pb) return pa - pb;
    const actorDiff = (b.actors?.length ?? 0) - (a.actors?.length ?? 0);
    if (actorDiff !== 0) return actorDiff;
    return a.id - b.id;
  });
});

const primaryCharacters = computed(() => {
  const important = sortedCharacters.value.filter((char) => (relationPriority.get(char.relation) ?? 2) <= 1);
  const source = important.length > 0 ? important : sortedCharacters.value;
  return source.slice(0, 6);
});

const characterCount = computed(() => props.characters?.length ?? 0);
const hiddenCharacterCount = computed(() => Math.max(characterCount.value - primaryCharacters.value.length, 0));

const displayEpisodes = computed(() => {
  return [...(props.episodes ?? [])].sort((a, b) => a.sort - b.sort);
});

const episodeCount = computed(() => props.episodes?.length ?? 0);

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

function fmtEp(ep: number): string {
  return String(ep).padStart(2, "0");
}

function fmtSort(sort: number): string {
  return sort === Math.floor(sort) ? String(sort).padStart(2, "0") : sort.toFixed(1);
}

function isActiveEpisode(ep: StructuredEpisode): boolean {
  if (props.activeEpisode == null || props.activeEpisode === "") return false;
  const active = String(props.activeEpisode).padStart(2, "0");
  const epNo = ep.ep != null ? fmtEp(ep.ep) : fmtSort(ep.sort);
  return active === epNo || String(props.activeEpisode) === String(ep.ep ?? ep.sort);
}

function isUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

function barColor(star: number): string {
  if (star >= 9) return "#f59e0b";
  if (star >= 7) return "#65a30d";
  if (star >= 5) return "#0891b2";
  return "#94a3b8";
}
</script>
