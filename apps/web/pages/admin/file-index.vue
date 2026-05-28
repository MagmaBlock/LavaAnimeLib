<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">文件索引</h1>
    </div>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">存储节点</div>
          <NSelect
            v-model:value="selectedDrive"
            :options="driveOptions"
            placeholder="选择存储节点"
            :loading="drivesLoading"
            filterable
            @update:value="onDriveChange"
          />
        </div>
        <NSpace size="small" class="pb-1">
          <NButton size="small" type="primary" @click="openRefreshDirModal">
            <template #icon>
              <Icon icon="fluent:folder-sync-24-regular" width="16" height="16" />
            </template>
            刷新目录
          </NButton>
          <NButton size="small" @click="refreshDrive" :loading="refreshingDrive">
            <template #icon>
              <Icon icon="fluent:arrow-sync-24-regular" width="16" height="16" />
            </template>
            全量刷新
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <template v-if="selectedDrive">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <NCard :bordered="false" class="!rounded-xl" size="small">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">文件总数</div>
          <div class="text-xl font-bold text-gray-800 dark:text-gray-200">
            {{ stats.totalFiles.toLocaleString() }}
          </div>
        </NCard>
        <NCard :bordered="false" class="!rounded-xl" size="small">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">目录数</div>
          <div class="text-xl font-bold text-gray-800 dark:text-gray-200">
            {{ stats.totalDirs.toLocaleString() }}
          </div>
        </NCard>
        <NCard :bordered="false" class="!rounded-xl" size="small">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">已删除记录</div>
          <div class="text-xl font-bold text-gray-800 dark:text-gray-200">
            {{ stats.deletedFiles.toLocaleString() }}
          </div>
        </NCard>
        <NCard :bordered="false" class="!rounded-xl" size="small">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">最后索引时间</div>
          <div class="text-lg font-bold text-gray-800 dark:text-gray-200">
            {{ stats.lastIndexedAt ? dayjs(stats.lastIndexedAt).format('MM-DD HH:mm') : '从未' }}
          </div>
        </NCard>
      </div>

      <NCard :bordered="false" class="!rounded-xl">
        <!-- Mode toggle + filters -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <NButtonGroup>
            <NButton
              size="small"
              :type="mode === 'browse' ? 'primary' : 'default'"
              @click="switchMode('browse')"
            >
              <template #icon><Icon icon="fluent:folder-24-regular" width="14" height="14" /></template>
              浏览模式
            </NButton>
            <NButton
              size="small"
              :type="mode === 'list' ? 'primary' : 'default'"
              @click="switchMode('list')"
            >
              <template #icon><Icon icon="fluent:list-24-regular" width="14" height="14" /></template>
              列表模式
            </NButton>
          </NButtonGroup>

          <NInput
            v-model:value="searchKeyword"
            placeholder="搜索文件名..."
            clearable
            class="!max-w-xs"
            @keyup.enter="searchFiles"
          >
            <template #prefix>
              <Icon icon="fluent:search-24-regular" width="16" height="16" />
            </template>
          </NInput>
          <NButton size="small" :loading="listLoading" @click="searchFiles">搜索</NButton>

          <NDivider vertical class="!h-6" />

          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">类型</span>
            <NSelect
              v-model:value="filterType"
              :options="typeFilterOptions"
              size="small"
              class="!w-24"
              @update:value="applyFilters"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">状态</span>
            <NSelect
              v-model:value="filterDeleted"
              :options="deletedFilterOptions"
              size="small"
              class="!w-24"
              @update:value="applyFilters"
            />
          </div>
        </div>

        <!-- Browse mode: breadcrumb -->
        <div v-if="mode === 'browse'" class="mb-3 flex items-center gap-1 text-sm flex-wrap">
          <NButton
            size="tiny"
            quaternary
            @click="navigateToParent(null)"
            :disabled="!currentParent"
          >
            <template #icon><Icon icon="fluent:arrow-up-24-regular" width="14" height="14" /></template>
          </NButton>
          <template v-for="(seg, idx) in breadcrumbs" :key="idx">
            <span class="text-gray-300">/</span>
            <NButton
              size="tiny"
              quaternary
              :type="idx === breadcrumbs.length - 1 ? 'primary' : 'default'"
              @click="navigateToBreadcrumb(idx)"
            >
              {{ seg }}
            </NButton>
          </template>
        </div>

        <!-- Browse mode: parent row -->
        <div v-if="mode === 'browse' && !listLoading && fileItems.length === 0 && !searchKeyword" class="text-center py-12 text-gray-400">
          <Icon icon="fluent:folder-open-24-regular" width="40" height="40" class="mx-auto mb-3 opacity-50" />
          <div>此目录为空</div>
        </div>

        <NDataTable
          remote
          :loading="listLoading"
          :columns="tableColumns"
          :data="fileItems"
          :pagination="pagination"
          :row-key="(row: FileIndexItem) => row.id"
          :single-line="false"
          size="small"
          :scroll-x="800"
          @update:sorter="handleSorterChange"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </NCard>
    </template>

    <NModal v-model:show="refreshDirModal" preset="card" title="刷新目录索引" class="!max-w-md">
      <NForm label-placement="top">
        <NFormItem label="目录路径" required>
          <NInput
            v-model:value="refreshDirPath"
            :placeholder="mode === 'browse' && currentParent ? currentParent : '例如 /LavaAnimeLib/2024/TV/某番剧'"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="refreshDirModal = false">取消</NButton>
          <NButton type="primary" :loading="refreshingDir" @click="doRefreshDir">
            开始刷新
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { h } from "vue";
import {
  NButton,
  NDivider,
  NSpace,
  NTag,
  type DataTableColumns,
  type DataTableSortState,
} from "naive-ui";
import dayjs from "dayjs";
import type { DriveRecord, FileIndexItem, FileIndexStats } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "文件索引管理" });

type SortKey = "name" | "size" | "indexedAt" | "type";

const message = useMessage();

const mode = ref<"browse" | "list">("browse");
const selectedDrive = ref<string | null>(null);
const driveOptions = ref<{ label: string; value: string }[]>([]);
const drivesLoading = ref(false);

const stats = ref<FileIndexStats>({ totalFiles: 0, totalDirs: 0, deletedFiles: 0, lastIndexedAt: null });
const fileItems = ref<FileIndexItem[]>([]);
const listLoading = ref(false);

const currentParent = ref<string>("");
const searchKeyword = ref("");
const filterType = ref<string | null>(null);
const filterDeleted = ref<string | null>(null);
const sortBy = ref<SortKey>("name");
const sortOrder = ref<"asc" | "desc">("asc");

const refreshingDir = ref(false);
const refreshingDrive = ref(false);
const refreshDirModal = ref(false);
const refreshDirPath = ref("");

const pagination = reactive({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
});

const typeFilterOptions = [
  { label: "全部", value: "" },
  { label: "文件", value: "file" },
  { label: "目录", value: "dir" },
];

const deletedFilterOptions = [
  { label: "全部", value: "" },
  { label: "有效", value: "0" },
  { label: "已删除", value: "1" },
];

const breadcrumbs = computed(() => {
  if (!currentParent.value) return [];
  return currentParent.value.split("/").filter(Boolean);
});

function buildBreadcrumbPath(idx: number): string {
  return "/" + breadcrumbs.value.slice(0, idx + 1).join("/");
}

function switchMode(m: "browse" | "list") {
  mode.value = m;
  currentParent.value = "";
  pagination.page = 1;
  loadFileList();
}

function navigateToParent(path: string | null) {
  currentParent.value = path ?? "";
  pagination.page = 1;
  loadFileList();
}

function navigateToBreadcrumb(idx: number) {
  currentParent.value = buildBreadcrumbPath(idx);
  pagination.page = 1;
  loadFileList();
}

function enterDirectory(dirPath: string) {
  currentParent.value = dirPath;
  pagination.page = 1;
  loadFileList();
}

function applyFilters() {
  pagination.page = 1;
  loadFileList();
}

function searchFiles() {
  pagination.page = 1;
  loadFileList();
}

function tableSortOrder(key: SortKey): "ascend" | "descend" | false {
  if (sortBy.value !== key) return false;
  return sortOrder.value === "asc" ? "ascend" : "descend";
}

const tableColumns = computed<DataTableColumns<FileIndexItem>>(() => {
  const base: DataTableColumns<FileIndexItem> = [
    {
      title: "文件名",
      key: "name",
      minWidth: 240,
      ellipsis: { tooltip: true },
      sorter: true,
      sortOrder: tableSortOrder("name"),
      render(row: FileIndexItem) {
        const isDir = row.type === "dir";
        const icon = isDir ? "fluent:folder-24-regular" : "fluent:document-24-regular";
        const colorClass = isDir ? "text-amber-500" : "text-blue-500";

        if (isDir && mode.value === "browse") {
          return h("div", {
            class: "flex items-center gap-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400",
            onClick: () => enterDirectory(row.path),
          }, [
            h(Icon, { icon, width: 16, height: 16, class: colorClass }),
            h("span", { class: "font-medium" }, row.name),
          ]);
        }

        return h("div", { class: "flex items-center gap-1.5" }, [
          h(Icon, { icon, width: 14, height: 14, class: colorClass }),
          h("span", row.name),
        ]);
      },
    },
  ];

  if (mode.value === "list") {
    base.push({
      title: "路径",
      key: "path",
      minWidth: 260,
      ellipsis: { tooltip: true },
      render(row: FileIndexItem) {
        return h("code", { class: "text-xs text-gray-500 dark:text-gray-500" }, row.path);
      },
    });
  }

  base.push(
    {
      title: "类型",
      key: "type",
      width: 80,
      sorter: true,
      sortOrder: tableSortOrder("type"),
      render(row: FileIndexItem) {
        return h(
          NTag,
          { size: "small", type: row.type === "dir" ? "warning" : "info", bordered: false },
          () => row.type,
        );
      },
    },
    {
      title: "大小",
      key: "size",
      width: 110,
      sorter: true,
      sortOrder: tableSortOrder("size"),
      render(row: FileIndexItem) {
        if (row.type === "dir") return h("span", { class: "text-gray-300" }, "-");
        return formatBytes(row.size);
      },
    },
    {
      title: "状态",
      key: "deleted",
      width: 90,
      render(row: FileIndexItem) {
        return h(
          NTag,
          { size: "small", type: row.deleted ? "error" : "success", bordered: false },
          () => row.deleted ? "已删除" : "有效",
        );
      },
    },
    {
      title: "索引时间",
      key: "indexedAt",
      width: 160,
      sorter: true,
      sortOrder: tableSortOrder("indexedAt"),
      render(row: FileIndexItem) {
        return dayjs(row.indexedAt).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  );

  return base;
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function handleSorterChange(sortState: DataTableSortState | DataTableSortState[] | null) {
  if (!sortState || (Array.isArray(sortState) && sortState.length === 0)) {
    sortBy.value = "name";
    sortOrder.value = "asc";
    loadFileList();
    return;
  }
  const s = Array.isArray(sortState) ? sortState[0] : sortState;
  if (!s || !s.order) {
    sortBy.value = "name";
    sortOrder.value = "asc";
  } else {
    sortBy.value = s.columnKey as SortKey;
    sortOrder.value = s.order === "ascend" ? "asc" : "desc";
  }
  loadFileList();
}

async function loadDrives() {
  drivesLoading.value = true;
  try {
    const result = await api.get("/v2/admin/drive/all");
    if (result.data?.code === 200) {
      const drives = result.data.data as DriveRecord[];
      driveOptions.value = drives
        .filter((d) => d.connectionConfigId != null)
        .map((d) => ({
          label: `${d.name} (${d.id})`,
          value: d.id,
        }));
    }
  } catch (_error) {
    message.error("获取存储节点失败");
  } finally {
    drivesLoading.value = false;
  }
}

async function onDriveChange() {
  currentParent.value = "";
  pagination.page = 1;
  searchKeyword.value = "";
  filterType.value = null;
  filterDeleted.value = null;
  await Promise.all([loadStats(), loadFileList()]);
}

async function loadStats() {
  if (!selectedDrive.value) return;
  try {
    const result = await api.get("/v2/admin/file-index/stats", {
      params: { driveId: selectedDrive.value },
    });
    if (result.data?.code === 200) {
      stats.value = result.data.data;
    }
  } catch (_error) {
    // non-critical
  }
}

async function loadFileList() {
  if (!selectedDrive.value) return;
  listLoading.value = true;
  try {
    const params: Record<string, unknown> = {
      driveId: selectedDrive.value,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    };
    if (searchKeyword.value) params.search = searchKeyword.value;
    if (filterType.value) params.type = filterType.value;
    if (filterDeleted.value) params.deleted = Number(filterDeleted.value);
    if (mode.value === "browse") {
      params.parent = currentParent.value;
    }
    const result = await api.get("/v2/admin/file-index/list", { params });
    if (result.data?.code === 200) {
      const data = result.data.data as { items: FileIndexItem[]; total: number };
      fileItems.value = data.items;
      pagination.itemCount = data.total;
    }
  } catch (_error) {
    message.error("获取文件索引失败");
  } finally {
    listLoading.value = false;
  }
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadFileList();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadFileList();
}

function openRefreshDirModal() {
  refreshDirPath.value = (mode.value === "browse" && currentParent.value) ? currentParent.value : "";
  refreshDirModal.value = true;
}

async function doRefreshDir() {
  if (!selectedDrive.value || !refreshDirPath.value.trim()) return;
  refreshingDir.value = true;
  try {
    const result = await api.post("/v2/admin/file-index/refresh-dir", {
      driveId: selectedDrive.value,
      dirPath: refreshDirPath.value.trim(),
    });
    if (result.data?.code === 200) {
      message.success("目录刷新完成");
      refreshDirModal.value = false;
      await Promise.all([loadStats(), loadFileList()]);
    }
  } catch (_error) {
    message.error("刷新目录失败");
  } finally {
    refreshingDir.value = false;
  }
}

async function refreshDrive() {
  if (!selectedDrive.value) return;
  refreshingDrive.value = true;
  try {
    const result = await api.post("/v2/admin/file-index/refresh-drive", {
      driveId: selectedDrive.value,
    });
    if (result.data?.code === 200) {
      message.success("已触发全量索引刷新，请稍后查看结果");
    }
  } catch (_error) {
    message.error("触发刷新失败");
  } finally {
    refreshingDrive.value = false;
  }
}

onMounted(() => {
  loadDrives();
});
</script>
