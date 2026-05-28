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
        <div class="flex flex-wrap items-center gap-3 mb-4">
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
          <NButton size="small" @click="searchFiles" :loading="listLoading">
            搜索
          </NButton>
        </div>

        <NDataTable
          remote
          :loading="listLoading"
          :columns="listColumns"
          :data="fileItems"
          :pagination="pagination"
          :row-key="(row: FileIndexItem) => row.id"
          :single-line="false"
          size="small"
          :scroll-x="800"
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
            placeholder="例如 /LavaAnimeLib/2024/TV/某番剧"
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
  NSpace,
  NTag,
  type DataTableColumns,
} from "naive-ui";
import dayjs from "dayjs";
import type { DriveRecord, FileIndexItem, FileIndexStats } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "文件索引管理" });

const message = useMessage();

const selectedDrive = ref<string | null>(null);
const driveOptions = ref<{ label: string; value: string }[]>([]);
const drivesLoading = ref(false);

const stats = ref<FileIndexStats>({ totalFiles: 0, totalDirs: 0, deletedFiles: 0, lastIndexedAt: null });
const fileItems = ref<FileIndexItem[]>([]);
const listLoading = ref(false);

const searchKeyword = ref("");

const refreshingDir = ref(false);
const refreshingDrive = ref(false);
const refreshDirModal = ref(false);
const refreshDirPath = ref("");

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
});

const listColumns: DataTableColumns<FileIndexItem> = [
  {
    title: "文件名",
    key: "name",
    minWidth: 220,
    ellipsis: { tooltip: true },
    render(row: FileIndexItem) {
      const icon = row.type === "dir" ? "fluent:folder-24-regular" : "fluent:document-24-regular";
      return h("div", { class: "flex items-center gap-1.5" }, [
        h(Icon, { icon, width: 14, height: 14, class: row.type === "dir" ? "text-amber-500" : "text-blue-500" }),
        h("span", row.name),
      ]);
    },
  },
  {
    title: "路径",
    key: "path",
    minWidth: 280,
    ellipsis: { tooltip: true },
    render(row: FileIndexItem) {
      return h("code", { class: "text-xs text-gray-500 dark:text-gray-500" }, row.path);
    },
  },
  {
    title: "类型",
    key: "type",
    width: 80,
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
    width: 100,
    render(row: FileIndexItem) {
      if (row.type === "dir") return h("span", { class: "text-gray-300" }, "-");
      return formatBytes(row.size);
    },
  },
  {
    title: "状态",
    key: "deleted",
    width: 80,
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
    render(row: FileIndexItem) {
      return dayjs(row.indexedAt).format("YYYY-MM-DD HH:mm:ss");
    },
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
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
  pagination.page = 1;
  searchKeyword.value = "";
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
    const result = await api.get("/v2/admin/file-index/list", {
      params: {
        driveId: selectedDrive.value,
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchKeyword.value || undefined,
      },
    });
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

function searchFiles() {
  pagination.page = 1;
  loadFileList();
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
  refreshDirPath.value = "";
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
