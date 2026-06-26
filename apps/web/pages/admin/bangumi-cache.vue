<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Bangumi 数据同步</h1>
    </div>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[160px_minmax(260px,360px)_1fr] lg:items-end">
        <div class="space-y-2">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">自动更新</div>
          <div class="flex h-9 items-center"><NSwitch v-model:value="settings.autoUpdateEnabled" @update:value="saveSettings" /></div>
        </div>
        <div class="space-y-2">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">过期时间（小时）</div>
          <div class="h-9"><NInputNumber v-model:value="settings.expireHours" :min="1" :max="8760" class="!w-full" @blur="saveSettings" /></div>
        </div>
        <NSpace size="small" class="lg:justify-self-end" wrap>
          <NButton :loading="refreshExpiredLoading" @click="refreshExpired"><template #icon><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 0 1-15.1 6.6M3 12a9 9 0 0 1 15.1-6.6M18 3v5h-5M6 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></template>扫描待同步</NButton>
          <NButton :loading="loading" @click="loadData"><template #icon><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 0 1-15.1 6.6M3 12a9 9 0 0 1 15.1-6.6M18 3v5h-5M6 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></template>刷新列表</NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-medium text-gray-800 dark:text-gray-200">同步进度</div>
        <div class="text-xs text-gray-400">
          <span :class="status.schedulerRunning ? 'text-green-500' : 'text-gray-400'">●</span>
          {{ status.schedulerRunning ? '调度器运行中' : '调度器未启动' }}
          <span class="mx-1">·</span>
          并发 {{ status.concurrency }}
        </div>
      </div>

      <div v-if="status.currentBatch" class="mb-3">
        <div class="flex items-center justify-between text-xs mb-1.5 text-gray-500 dark:text-gray-400">
          <span>当前批次 <span class="text-gray-400">（{{ formatTime(status.currentBatch.startedAt) }} 开始）</span></span>
          <span>{{ status.currentBatch.completed + status.currentBatch.failed }} / {{ status.currentBatch.total }} · 失败 {{ status.currentBatch.failed }}</span>
        </div>
        <NProgress type="line" :percentage="batchPercent" :status="batchPercent >= 100 ? 'success' : 'default'" :show-indicator="false" :height="10" :border-radius="5" />
      </div>
      <div v-else-if="status.lastBatch" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
        上一批次（{{ formatTime(status.lastBatch.startedAt) }}）：完成 {{ status.lastBatch.completed }}/{{ status.lastBatch.total }}，失败 {{ status.lastBatch.failed }}，结束于 {{ formatTime(status.lastBatch.finishedAt) }}
      </div>
      <div v-else class="mb-3 text-xs text-gray-400">暂无同步任务记录</div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
        <div><div class="text-xs text-gray-400 mb-0.5">进行中</div><div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ status.active }}</div></div>
        <div><div class="text-xs text-gray-400 mb-0.5">队列等待</div><div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ status.pending }}</div></div>
        <div><div class="text-xs text-gray-400 mb-0.5">累计成功</div><div class="text-lg font-bold text-green-600 dark:text-green-400">{{ status.totalCompleted }}</div></div>
        <div><div class="text-xs text-gray-400 mb-0.5">累计失败</div><div class="text-lg font-bold text-red-600 dark:text-red-400">{{ status.totalFailed }}</div></div>
        <div><div class="text-xs text-gray-400 mb-0.5">最近活动</div><div class="text-sm font-bold text-gray-800 dark:text-gray-200 pt-1">{{ formatTime(status.lastEventAt) }}</div></div>
      </div>

      <div v-if="status.refreshing.length > 0" class="mb-3 flex flex-wrap items-center gap-1">
        <span class="text-xs text-gray-400 mr-1">正在刷新：</span>
        <NTag v-for="id in status.refreshing" :key="id" size="small" type="info" :bordered="false">{{ id }}</NTag>
      </div>

      <div v-if="status.log.length > 0">
        <div class="text-xs text-gray-400 mb-1.5">最近活动日志</div>
        <div class="max-h-40 overflow-y-auto space-y-1">
          <div v-for="(entry, idx) in status.log" :key="idx" class="flex items-center gap-2 font-mono text-xs">
            <span class="text-gray-400">{{ formatTime(entry.time) }}</span>
            <NTag size="tiny" :type="entry.status === 'success' ? 'success' : 'error'" :bordered="false">{{ entry.status === 'success' ? '成功' : '失败' }}</NTag>
            <span class="text-gray-700 dark:text-gray-300">bgm{{ entry.bgmID }}</span>
            <span v-if="entry.error" class="text-red-400 truncate">{{ entry.error }}</span>
          </div>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="!rounded-xl">
      <NDataTable remote :loading="loading" :columns="columns" :data="rows" :pagination="pagination" :row-key="(row) => row.bgmID" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" />
    </NCard>
  </div>
</template>

<script lang="ts" setup>
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag, NProgress } from "naive-ui";
import dayjs from "dayjs";

definePageMeta({ layout: "admin" });
useHead({ title: "Bangumi 数据同步" });

type CacheSettings = { autoUpdateEnabled: boolean; expireHours: number };
type CacheItem = { bgmID: number; updateTime: string | null; syncStatus: "synced" | "expired" | "unsynced"; hasEpisodes: boolean; hasCharacters: boolean; animeCount: number };
type LogEntry = { bgmID: number; status: "success" | "failed"; time: number; error?: string };
type Batch = { startedAt: number; finishedAt: number | null; total: number; completed: number; failed: number };
type CacheStatus = {
  active: number;
  pending: number;
  concurrency: number;
  refreshing: number[];
  schedulerRunning: boolean;
  totalCompleted: number;
  totalFailed: number;
  lastEventAt: number | null;
  currentBatch: Batch | null;
  lastBatch: Batch | null;
  log: LogEntry[];
};

const loading = ref(false);
const refreshExpiredLoading = ref(false);
const syncingIds = ref<number[]>([]);
const rows = ref<CacheItem[]>([]);
const settings = ref<CacheSettings>({ autoUpdateEnabled: true, expireHours: 168 });
const status = ref<CacheStatus>({
  active: 0,
  pending: 0,
  concurrency: 5,
  refreshing: [],
  schedulerRunning: false,
  totalCompleted: 0,
  totalFailed: 0,
  lastEventAt: null,
  currentBatch: null,
  lastBatch: null,
  log: [],
});
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const batchPercent = computed(() => {
  const b = status.value.currentBatch;
  if (!b || b.total === 0) return 0;
  return Math.min(100, Math.round(((b.completed + b.failed) / b.total) * 100));
});

const isBusy = computed(
  () => status.value.active > 0 || status.value.pending > 0 || (status.value.currentBatch != null && batchPercent.value < 100),
);

function formatTime(time: number | null): string {
  if (!time) return "-";
  return dayjs(time).format("MM-DD HH:mm:ss");
}

async function loadStatus() {
  try {
    const result = await api.get("/v2/admin/bangumi-cache/status", { noCatch: true } as any);
    if (result.data?.code === 200) status.value = result.data.data;
  } catch (_error) {
    // 静默处理，保留上次状态
  } finally {
    scheduleNextStatus();
  }
}

function scheduleNextStatus() {
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(loadStatus, isBusy.value ? 2000 : 8000);
}

const pagination = reactive({ page: 1, pageSize: 50, itemCount: 0, showSizePicker: true, pageSizes: [20, 50, 100, 200] });

const columns = computed<DataTableColumns<CacheItem>>(() => [
  { title: "BGM ID", key: "bgmID", width: 110 },
  { title: "关联条目", key: "animeCount", width: 90 },
  {
    title: "同步状态", key: "syncStatus", width: 100,
    render(row) {
      const map: Record<string, { type: any; text: string }> = {
        synced: { type: "success", text: "已同步" },
        expired: { type: "warning", text: "已过期" },
        unsynced: { type: "error", text: "未同步" },
      };
      const s = map[row.syncStatus] || { type: "default", text: row.syncStatus };
      return h(NTag, { size: "small", type: s.type, bordered: false }, { default: () => s.text });
    },
  },
  {
    title: "数据完整度", key: "completeness", width: 130,
    render(row) {
      return h("div", { class: "flex flex-wrap gap-1" }, [
        h(NTag, { size: "small", type: !!row.updateTime ? "success" : "default", bordered: false }, { default: () => "Subject" }),
        h(NTag, { size: "small", type: row.hasEpisodes ? "success" : "default", bordered: false }, { default: () => "剧集" }),
        h(NTag, { size: "small", type: row.hasCharacters ? "success" : "default", bordered: false }, { default: () => "角色" }),
      ]);
    },
  },
  {
    title: "上次同步", key: "updateTime", width: 180,
    render(row) { return row.updateTime ? dayjs(row.updateTime).format("YYYY-MM-DD HH:mm") : "-"; },
  },
  {
    title: "操作", key: "actions", width: 100,
    render(row) {
      return h(NButton, { size: "small", loading: syncingIds.value.includes(row.bgmID), onClick: () => syncOne(row.bgmID) }, { default: () => row.syncStatus === "unsynced" ? "同步" : "更新" });
    },
  },
]);

onMounted(() => {
  loadData();
  loadStatus();
});

onUnmounted(() => {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
});

watch(
  () => status.value.currentBatch,
  (cur, prev) => {
    if (prev && !cur) loadData();
  },
);

async function loadData() {
  loading.value = true;
  try {
    const result = await api.get("/v2/admin/bangumi-cache/list", { params: { skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize } });
    if (result.data?.code === 200) {
      rows.value = result.data.data.list;
      pagination.itemCount = result.data.data.total;
      settings.value = result.data.data.settings;
    }
  } catch (error) {
    console.error("加载失败", error);
    window.$message?.error("加载 Bangumi 数据失败");
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  try {
    const result = await api.post("/v2/admin/bangumi-cache/settings", settings.value);
    if (result.data?.code === 200) { settings.value = result.data.data; window.$message?.success("设置已保存"); await loadData(); }
  } catch (error) {
    console.error("保存设置失败", error);
    window.$message?.error("保存设置失败");
  }
}

async function syncOne(bgmID: number) {
  syncingIds.value = [...syncingIds.value, bgmID];
  try {
    await api.post("/v2/admin/bangumi-cache/refresh", { bgmID });
    window.$message?.success(`BGM ${bgmID} 已同步`);
    await loadData();
  } catch (error) {
    console.error("同步失败", error);
    window.$message?.error(`BGM ${bgmID} 同步失败`);
  } finally {
    syncingIds.value = syncingIds.value.filter((id) => id !== bgmID);
  }
}

async function refreshExpired() {
  refreshExpiredLoading.value = true;
  try {
    const result = await api.post("/v2/admin/bangumi-cache/refresh-expired");
    window.$message?.success(`已排队 ${result.data?.data?.queued ?? 0} 个同步任务`);
    await loadData();
    loadStatus();
  } catch (error) {
    console.error("扫描失败", error);
    window.$message?.error("扫描待同步数据失败");
  } finally {
    refreshExpiredLoading.value = false;
  }
}

function handlePageChange(page: number) { pagination.page = page; loadData(); }
function handlePageSizeChange(pageSize: number) { pagination.pageSize = pageSize; pagination.page = 1; loadData(); }
</script>
