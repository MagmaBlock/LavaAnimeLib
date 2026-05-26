<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Bangumi 缓存</h1>
    </div>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[160px_minmax(260px,360px)_1fr] lg:items-end">
        <div class="space-y-2">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">自动更新</div>
          <div class="flex h-9 items-center">
            <NSwitch v-model:value="settings.autoUpdateEnabled" @update:value="saveSettings" />
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">过期时间（小时）</div>
          <div class="h-9">
            <NInputNumber
              v-model:value="settings.expireHours"
              :min="1"
              :max="8760"
              class="!w-full"
              @blur="saveSettings"
            />
          </div>
        </div>

        <NSpace size="small" class="lg:justify-self-end" wrap>
          <NButton :loading="refreshExpiredLoading" @click="refreshExpired">
            <template #icon>
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 12a9 9 0 0 1-15.1 6.6M3 12a9 9 0 0 1 15.1-6.6M18 3v5h-5M6 21v-5h5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </template>
            扫描过期缓存
          </NButton>
          <NButton :loading="loading" @click="loadData">
            <template #icon>
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 12a9 9 0 0 1-15.1 6.6M3 12a9 9 0 0 1 15.1-6.6M18 3v5h-5M6 21v-5h5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </template>
            刷新列表
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" class="!rounded-xl">
      <NDataTable
        remote
        :loading="loading"
        :columns="columns"
        :data="rows"
        :pagination="pagination"
        :row-key="(row: BangumiCacheItem) => row.bgmID"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </NCard>
  </div>
</template>

<script lang="ts" setup>
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import dayjs from "dayjs";

definePageMeta({
  layout: "admin",
});

useHead({ title: "Bangumi 缓存管理" });

type BangumiCacheSettings = {
  autoUpdateEnabled: boolean;
  expireHours: number;
};

type BangumiCacheItem = {
  bgmID: number;
  updateTime: string | null;
  hasSubjects: boolean;
  hasRelations: boolean;
  hasCharacters: boolean;
  expired: boolean;
  animeCount: number;
};

const loading = ref(false);
const refreshExpiredLoading = ref(false);
const refreshingIds = ref<number[]>([]);
const rows = ref<BangumiCacheItem[]>([]);
const settings = ref<BangumiCacheSettings>({
  autoUpdateEnabled: true,
  expireHours: 168,
});

const pagination = reactive({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
});

const columns = computed<DataTableColumns<BangumiCacheItem>>(() => [
  {
    title: "BGM ID",
    key: "bgmID",
    width: 110,
  },
  {
    title: "关联条目",
    key: "animeCount",
    width: 100,
  },
  {
    title: "缓存内容",
    key: "content",
    render(row) {
      return h("div", { class: "flex flex-wrap gap-1" }, [
        h(NTag, { size: "small", type: row.hasSubjects ? "success" : "warning", bordered: false }, { default: () => "subject" }),
        h(NTag, { size: "small", type: row.hasRelations ? "success" : "default", bordered: false }, { default: () => "relations" }),
        h(NTag, { size: "small", type: row.hasCharacters ? "success" : "default", bordered: false }, { default: () => "characters" }),
      ]);
    },
  },
  {
    title: "状态",
    key: "expired",
    width: 100,
    render(row) {
      return h(
        NTag,
        { size: "small", type: row.expired ? "warning" : "success", bordered: false },
        { default: () => row.expired ? "已过期" : "有效" }
      );
    },
  },
  {
    title: "上次抓取",
    key: "updateTime",
    width: 180,
    render(row) {
      return row.updateTime ? dayjs(row.updateTime).format("YYYY-MM-DD HH:mm") : "-";
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render(row) {
      return h(
        NButton,
        {
          size: "small",
          loading: refreshingIds.value.includes(row.bgmID),
          onClick: () => refreshOne(row.bgmID),
        },
        { default: () => "刷新" }
      );
    },
  },
]);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await api.get("/v2/admin/bangumi-cache/list", {
      params: {
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      },
    });
    if (result.data?.code === 200) {
      rows.value = result.data.data.list;
      pagination.itemCount = result.data.data.total;
      settings.value = result.data.data.settings;
    }
  } catch (error) {
    console.error("加载 Bangumi 缓存失败", error);
    window.$message?.error("加载 Bangumi 缓存失败");
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  try {
    const result = await api.post("/v2/admin/bangumi-cache/settings", settings.value);
    if (result.data?.code === 200) {
      settings.value = result.data.data;
      window.$message?.success("设置已保存");
      await loadData();
    }
  } catch (error) {
    console.error("保存 Bangumi 缓存设置失败", error);
    window.$message?.error("保存设置失败");
  }
}

async function refreshOne(bgmID: number) {
  refreshingIds.value = [...refreshingIds.value, bgmID];
  try {
    await api.post("/v2/admin/bangumi-cache/refresh", { bgmID });
    window.$message?.success(`BGM ${bgmID} 已刷新`);
    await loadData();
  } catch (error) {
    console.error("刷新 Bangumi 缓存失败", error);
    window.$message?.error(`BGM ${bgmID} 刷新失败`);
  } finally {
    refreshingIds.value = refreshingIds.value.filter((id) => id !== bgmID);
  }
}

async function refreshExpired() {
  refreshExpiredLoading.value = true;
  try {
    const result = await api.post("/v2/admin/bangumi-cache/refresh-expired");
    window.$message?.success(`已排队 ${result.data?.data?.queued ?? 0} 个刷新任务`);
    await loadData();
  } catch (error) {
    console.error("扫描过期 Bangumi 缓存失败", error);
    window.$message?.error("扫描过期缓存失败");
  } finally {
    refreshExpiredLoading.value = false;
  }
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
}
</script>
