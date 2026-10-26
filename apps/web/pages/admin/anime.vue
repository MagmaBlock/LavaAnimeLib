<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        番剧编辑
      </h1>
    </div>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[220px] space-y-1.5">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
            搜索
          </div>
          <NInput
            v-model:value="searchValue"
            placeholder="名称 / 标题 / bgmid；纯数字按 laID 精确 + bgmid 模糊"
            clearable
            @keyup.enter="onSearch"
            @clear="onSearch"
          />
        </div>
        <div class="space-y-1.5">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
            状态
          </div>
          <NSelect
            v-model:value="filterDeleted"
            :options="deletedOptions"
            class="!w-[140px]"
            @update:value="onSearch"
          />
        </div>
        <NButton type="primary" :loading="listLoading" @click="onSearch"
          >查询</NButton
        >
        <NButton :loading="libraryLoading" @click="openLibrarySync"
          >识别入库</NButton
        >
      </div>
    </NCard>

    <NCard :bordered="false" class="!rounded-xl">
      <NDataTable
        remote
        :loading="listLoading"
        :columns="tableColumns"
        :data="list"
        :pagination="pagination"
        :row-key="(row: AnimeListItem) => row.id"
        :single-line="false"
        size="small"
        :scroll-x="900"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </NCard>

    <!-- 从文件索引识别番剧 -->
    <NModal
      v-model:show="libraryModal"
      preset="card"
      title="从文件索引识别番剧"
      style="width: 760px"
      :mask-closable="!libraryApplying"
    >
      <div v-if="libraryLoading" class="py-10 text-center text-gray-400">
        正在读取文件索引...
      </div>
      <template v-else-if="libraryPreview">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div
            v-for="stat in libraryStats"
            :key="stat.label"
            class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3"
          >
            <div class="text-xs text-gray-400 mb-0.5">{{ stat.label }}</div>
            <div :class="['text-lg font-bold', stat.class]">{{ stat.value }}</div>
          </div>
        </div>

        <div class="text-xs text-gray-400 mb-3">
          已索引番剧目录 {{ libraryPreview.directoryCount }} 个。新增与恢复会立即执行；缺失仅作诊断，不会自动删除。
        </div>
        <div
          v-if="!libraryPreview.canApply"
          class="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mb-3"
        >
          <div class="font-medium mb-0.5">扫描健康检查未通过，暂不允许入库</div>
          <div>{{ libraryPreview.blockedReason ?? "请先完成一次成功的全量扫描" }}</div>
        </div>

        <div class="max-h-[46vh] overflow-y-auto space-y-4">
          <section v-if="libraryPreview.discovered.length">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              新增（{{ libraryPreview.discovered.length }}）
            </div>
            <div
              v-for="item in libraryPreview.discovered"
              :key="item.path"
              class="flex items-center justify-between gap-2 py-1 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <span class="text-gray-700 dark:text-gray-300 truncate">
                {{ item.year }} / {{ item.type }} / {{ item.name }}
              </span>
              <NTag size="small" type="success" :bordered="false">bgm{{ item.bgmid }}</NTag>
            </div>
          </section>

          <section v-if="libraryPreview.restorable.length">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              待恢复（{{ libraryPreview.restorable.length }}）
            </div>
            <div
              v-for="row in libraryPreview.restorable"
              :key="row.id"
              class="flex items-center justify-between gap-2 py-1 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <span class="text-gray-700 dark:text-gray-300 truncate">
                {{ row.year }} / {{ row.type }} / {{ row.name }}
              </span>
              <span class="text-xs text-gray-400 font-mono">laID {{ row.id }}</span>
            </div>
          </section>

          <section v-if="libraryPreview.missing.length">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              索引中未见（{{ libraryPreview.missing.length }}）
            </div>
            <div class="text-xs text-gray-400 mb-1.5">
              仅供参考；当前暂不支持标记删除。
            </div>
            <div
              v-for="row in libraryPreview.missing"
              :key="row.id"
              class="flex items-center justify-between gap-2 py-1 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <span class="text-gray-700 dark:text-gray-300 truncate">
                {{ row.year }} / {{ row.type }} / {{ row.name }}
              </span>
              <span class="text-xs text-gray-400 font-mono">laID {{ row.id }}</span>
            </div>
          </section>

          <section v-if="libraryPreview.unmatched.length">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              无法自动识别（{{ libraryPreview.unmatched.length }}）
            </div>
            <div
              v-for="item in libraryPreview.unmatched"
              :key="item.path"
              class="py-1 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div class="text-gray-700 dark:text-gray-300 truncate">{{ item.path }}</div>
              <div class="text-xs text-gray-400">
                {{ item.reason }}
                <span v-if="item.driveIds.length">· {{ item.driveIds.join(" / ") }}</span>
              </div>
            </div>
          </section>

          <div
            v-if="!libraryPreview.discovered.length && !libraryPreview.restorable.length && !libraryPreview.missing.length && !libraryPreview.unmatched.length"
            class="py-8 text-center text-gray-400"
          >
            索引与番剧表一致，无变更
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-gray-400">
            缺失只会列出供核对，不会被自动标记删除。
          </div>
          <div class="flex gap-2">
            <NButton :disabled="libraryApplying" @click="libraryModal = false">取消</NButton>
            <NButton
              type="primary"
              :loading="libraryApplying"
              :disabled="!libraryPreview?.canApply || !libraryHasChanges"
              @click="applyLibrarySync"
            >
              执行入库
            </NButton>
          </div>
        </div>
      </template>
    </NModal>

    <!-- 编辑 drawer -->
    <NDrawer v-model:show="editDrawer" :width="520" placement="right">
      <NDrawerContent title="编辑番剧" closable>
        <template v-if="record">
          <div class="space-y-5">
            <div class="flex flex-wrap gap-4">
              <div>
                <div class="text-xs text-gray-400 mb-0.5">laID</div>
                <div
                  class="text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  {{ record.id }}
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-400 mb-0.5">source</div>
                <div
                  class="text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  {{ record.episode_start_manual === 1 ? "manual" : "auto" }}
                </div>
              </div>

              <NDivider class="!my-1" />

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    name
                  </div>
                  <NInput v-model:value="form.name" placeholder="番剧名称" />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    bgmid
                  </div>
                  <NInput
                    v-model:value="form.bgmid"
                    placeholder="Bangumi ID（可空）"
                  />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    year
                  </div>
                  <NInput v-model:value="form.year" placeholder="如 2024" />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    type
                  </div>
                  <NInput v-model:value="form.type" placeholder="如 TV" />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    title
                  </div>
                  <NInput
                    v-model:value="form.title"
                    placeholder="原始标题（可空）"
                  />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    poster
                  </div>
                  <NInput
                    v-model:value="form.poster"
                    placeholder="封面 URL（可空）"
                  />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    nsfw
                  </div>
                  <NSwitch
                    :value="form.nsfw === 1"
                    @update:value="(v: boolean) => (form.nsfw = v ? 1 : 0)"
                  />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    deleted
                  </div>
                  <NSwitch
                    :value="form.deleted === 1"
                    @update:value="(v: boolean) => (form.deleted = v ? 1 : 0)"
                  />
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    views
                  </div>
                  <NInputNumber
                    v-model:value="form.views"
                    :min="0"
                    placeholder="播放量"
                    class="!w-full"
                  />
                </div>
              </div>

              <NDivider class="!my-1" />

              <div class="grid grid-cols-[140px_1fr] gap-4 items-start">
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    来源 (manual)
                  </div>
                  <div class="flex items-center gap-2">
                    <NSwitch v-model:value="formManual" />
                    <NTag
                      size="small"
                      :type="formManual ? 'warning' : 'info'"
                      :bordered="false"
                      >{{ formManual ? "manual" : "auto" }}</NTag
                    >
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formManual ? "sync 不会改写" : "sync 会覆盖" }}
                  </div>
                </div>
                <div class="space-y-1.5">
                  <div
                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    episode_start
                  </div>
                  <NInputNumber
                    v-model:value="formEpisodeStart"
                    :min="1"
                    :disabled="!formManual"
                    :placeholder="formManual ? '>=1' : 'auto'"
                    class="!w-full"
                  />
                  <div class="text-xs text-gray-400">
                    当前值：<span class="font-mono">{{
                      record.episode_start ?? "null"
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton @click="editDrawer = false">关闭</NButton>
            <NButton type="primary" :loading="saving" @click="saveAll"
              >保存全部</NButton
            >
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script lang="ts" setup>
import { h } from "vue";
import { Icon } from "@iconify/vue";
import type { DataTableColumns } from "naive-ui";
import { NButton } from "naive-ui";

definePageMeta({ layout: "admin" });
useHead({ title: "番剧编辑" });

interface AnimeListItem {
  id: number;
  year: string;
  type: string;
  name: string;
  views: number;
  bgmid: string | null;
  nsfw: number;
  title: string | null;
  deleted: number;
  poster: string | null;
  episode_start: number | null;
  episode_start_manual: 0 | 1;
}

interface LibraryDirectoryItem {
  path: string;
  year: string;
  type: string;
  name: string;
  bgmid: string;
  title: string;
  nsfw: number;
}

interface LibraryAnimeRow {
  id: number;
  year: string;
  type: string;
  name: string;
  bgmid: string | null;
  title: string | null;
  deleted: number;
}

interface LibrarySyncPreview {
  discovered: LibraryDirectoryItem[];
  restorable: LibraryAnimeRow[];
  missing: LibraryAnimeRow[];
  unmatched: { path: string; reason: string; driveIds: string[] }[];
  directoryCount: number;
  canMarkMissing: boolean;
  scanHealthy: boolean;
  blockedReason: string | null;
  canApply: boolean;
}

const searchValue = ref("");
const filterDeleted = ref<"" | "0" | "1">("");
const list = ref<AnimeListItem[]>([]);
const listLoading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
});

const deletedOptions = [
  { label: "全部", value: "" },
  { label: "有效", value: "0" },
  { label: "已删除", value: "1" },
];

const tableColumns = computed<DataTableColumns<AnimeListItem>>(() => [
  {
    title: "laID",
    key: "id",
    width: 80,
    render: (row) => h("span", { class: "font-mono" }, String(row.id)),
  },
  {
    title: "名称",
    key: "name",
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) =>
      h("div", { class: "flex items-center gap-1.5" }, [
        row.deleted === 1
          ? h(Icon, {
              icon: "fluent:delete-24-regular",
              width: 14,
              class: "text-gray-400",
            })
          : null,
        h(
          "span",
          {
            class:
              row.deleted === 1 ? "text-gray-400 line-through" : "font-medium",
          },
          row.name,
        ),
      ]),
  },
  {
    title: "year",
    key: "year",
    width: 90,
  },
  {
    title: "type",
    key: "type",
    width: 80,
  },
  {
    title: "bgmid",
    key: "bgmid",
    width: 100,
    render: (row) =>
      h("span", { class: "font-mono text-xs" }, row.bgmid ?? "—"),
  },
  {
    title: "views",
    key: "views",
    width: 80,
    render: (row) =>
      h("span", { class: "font-mono" }, row.views.toLocaleString()),
  },
  {
    title: "ep_start",
    key: "episode_start",
    width: 100,
    render: (row) =>
      h("span", { class: "font-mono text-xs" }, [
        row.episode_start ?? "—",
        row.episode_start_manual === 1
          ? h("span", { class: "text-amber-500 ml-1" }, "M")
          : null,
      ]),
  },
  {
    title: "操作",
    key: "actions",
    width: 90,
    fixed: "right",
    render: (row) =>
      h(
        NButton,
        {
          size: "small",
          type: "primary",
          quaternary: true,
          onClick: () => openEdit(row.id),
        },
        { default: () => "编辑" },
      ),
  },
]);

async function loadList() {
  listLoading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    if (searchValue.value.trim()) params.search = searchValue.value.trim();
    if (filterDeleted.value) params.deleted = Number(filterDeleted.value);
    const result = await api.get("/v2/admin/anime/list", { params });
    if (result.data?.code === 200) {
      const data = result.data.data as { list: AnimeListItem[]; total: number };
      list.value = data.list;
      pagination.itemCount = data.total;
    }
  } catch (_e) {
    window.$message?.error("获取列表失败");
  } finally {
    listLoading.value = false;
  }
}

function onSearch() {
  pagination.page = 1;
  loadList();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadList();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadList();
}

// ---- 识别入库 ----
const libraryModal = ref(false);
const libraryLoading = ref(false);
const libraryApplying = ref(false);
const libraryPreview = ref<LibrarySyncPreview | null>(null);

const libraryStats = computed(() => [
  {
    label: "新增",
    value: libraryPreview.value?.discovered.length ?? 0,
    class: "text-green-600 dark:text-green-400",
  },
  {
    label: "待恢复",
    value: libraryPreview.value?.restorable.length ?? 0,
    class: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "索引中未见",
    value: libraryPreview.value?.missing.length ?? 0,
    class: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "无法识别",
    value: libraryPreview.value?.unmatched.length ?? 0,
    class: "text-red-600 dark:text-red-400",
  },
]);

const libraryHasChanges = computed(() => {
  const preview = libraryPreview.value;
  if (!preview) return false;
  return (
    preview.discovered.length > 0 ||
    preview.restorable.length > 0
  );
});

async function openLibrarySync() {
  libraryModal.value = true;
  libraryLoading.value = true;
  libraryPreview.value = null;
  try {
    const result = await api.get("/v2/admin/anime/library/preview");
    if (result.data?.code === 200) {
      libraryPreview.value = result.data.data as LibrarySyncPreview;
    }
  } catch (_error) {
    // 拦截器已提示
  } finally {
    libraryLoading.value = false;
  }
}

async function applyLibrarySync() {
  libraryApplying.value = true;
  try {
    const result = await api.post("/v2/admin/anime/library/sync", {});
    window.$message?.success(result.data?.message ?? "识别完成");
    libraryModal.value = false;
    pagination.page = 1;
    await loadList();
  } catch (_error) {
    // 拦截器已提示
  } finally {
    libraryApplying.value = false;
  }
}

// ---- 编辑 drawer ----
const editDrawer = ref(false);
const record = ref<AnimeListItem | null>(null);
const saving = ref(false);

const form = reactive({
  name: "",
  year: "",
  type: "",
  bgmid: "" as string | null,
  title: "" as string | null,
  poster: "" as string | null,
  nsfw: 0 as 0 | 1,
  deleted: 0 as 0 | 1,
  views: 0 as number | null,
});
const formManual = ref(false);
const formEpisodeStart = ref<number | null>(null);

function fillForm(r: AnimeListItem) {
  form.name = r.name;
  form.year = r.year;
  form.type = r.type;
  form.bgmid = r.bgmid;
  form.title = r.title;
  form.poster = r.poster;
  form.nsfw = r.nsfw as 0 | 1;
  form.deleted = r.deleted as 0 | 1;
  form.views = r.views;
  formManual.value = r.episode_start_manual === 1;
  formEpisodeStart.value = r.episode_start;
}

async function openEdit(laID: number) {
  try {
    const result = await api.get("/v2/admin/anime", { params: { laID } });
    if (result.data?.code === 200) {
      record.value = result.data.data as AnimeListItem;
      fillForm(record.value);
      editDrawer.value = true;
    }
  } catch (error: any) {
    window.$message?.error(error?.response?.data?.message ?? "加载失败");
  }
}

async function saveAll() {
  if (!record.value) return;
  if (
    formManual.value &&
    (!formEpisodeStart.value || formEpisodeStart.value < 1)
  ) {
    window.$message?.error("manual 模式下 episode_start 必须 >= 1");
    return;
  }
  saving.value = true;
  try {
    // 1) 保存基本信息
    await api.post("/v2/admin/anime/update", {
      laID: record.value.id,
      name: form.name,
      year: form.year,
      type: form.type,
      bgmid: form.bgmid,
      title: form.title,
      poster: form.poster,
      nsfw: form.nsfw,
      deleted: form.deleted,
      views: form.views,
    });
    // 2) 保存 episode_start (若 manual 状态或值有变化)
    const oldManual = record.value.episode_start_manual === 1;
    if (
      formManual.value !== oldManual ||
      (formManual.value &&
        formEpisodeStart.value !== record.value.episode_start)
    ) {
      const payload: Record<string, unknown> = {
        laID: record.value.id,
        manual: formManual.value,
      };
      if (formManual.value) payload.episode_start = formEpisodeStart.value;
      await api.post("/v2/admin/anime/episode-start", payload);
    }
    window.$message?.success("已保存");
    editDrawer.value = false;
    await loadList();
  } catch (error: any) {
    window.$message?.error(error?.response?.data?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

onMounted(loadList);
</script>

<style scoped></style>
