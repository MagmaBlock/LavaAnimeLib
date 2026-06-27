<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">番剧集数偏移</h1>
      <p class="mt-1 text-xs text-gray-400">
        修改番剧的 <code>episode_start</code>（绝对集数起始号）。auto 模式下值由 Bangumi 数据自动同步回填；切换到 manual 后写入的值将永不被同步改写。
      </p>
    </div>

    <NCard :bordered="false" class="!rounded-xl mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[220px] space-y-1.5">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">查询</div>
          <NInputGroup>
            <NInput
              v-model:value="searchValue"
              placeholder="输入 laID (数字)"
              @keyup.enter="search"
            />
          </NInputGroup>
        </div>
        <NButton type="primary" :loading="loading" @click="search">查询</NButton>
      </div>
    </NCard>

    <NCard v-if="notFound" :bordered="false" class="!rounded-xl">
      <NResult status="info" title="未找到番剧" description="按上述条件未匹配到任何番剧条目，请确认 laID / bgmid 是否正确。" />
    </NCard>

    <NCard v-else-if="record" :bordered="false" class="!rounded-xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <div class="text-xs text-gray-400 mb-0.5">laID</div>
          <div class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ record.id }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-0.5">bgmid</div>
          <div class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ record.bgmid ?? "（无）" }}</div>
        </div>
        <div class="sm:col-span-2">
          <div class="text-xs text-gray-400 mb-0.5">名称</div>
          <div class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ record.name }}</div>
        </div>
      </div>

      <NDivider class="!my-3" />

      <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 items-start">
        <div class="space-y-1.5">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">来源 (manual)</div>
          <div class="flex items-center gap-2">
            <NSwitch v-model:value="formManual" />
            <NTag size="small" :type="formManual ? 'warning' : 'info'" :bordered="false">{{ formManual ? "manual" : "auto" }}</NTag>
          </div>
          <div class="text-xs text-gray-400">{{ formManual ? "手动覆盖，sync 不会改写" : "自动回填，sync 会覆盖" }}</div>
        </div>
        <div class="space-y-1.5">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">episode_start</div>
          <NInputNumber
            v-model:value="formEpisodeStart"
            :min="1"
            :disabled="!formManual"
            :placeholder="formManual ? '设置偏移值 (>=1)' : 'auto 模式下由 sync 自动算出'"
            class="!w-full"
          />
          <div class="text-xs text-gray-400">
            当前数据库值：<span class="font-mono">{{ record.episode_start ?? "null" }}</span> · source: <span class="font-mono">{{ record.episode_start_manual === 1 ? 'manual' : 'auto' }}</span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <NButton type="primary" :loading="saving" @click="save">保存</NButton>
      </div>
    </NCard>

    <NCard v-else :bordered="false" class="!rounded-xl">
      <NEmpty description="输入 laID 或 bgmid 后查询" />
    </NCard>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: "admin" });
useHead({ title: "番剧集数偏移" });

type Record = {
  id: number;
  name: string;
  bgmid: string | null;
  episode_start: number | null;
  episode_start_manual: 0 | 1;
};

const searchValue = ref("");

const loading = ref(false);
const saving = ref(false);
const notFound = ref(false);
const record = ref<Record | null>(null);

const formManual = ref(false);
const formEpisodeStart = ref<number | null>(null);

async function search() {
  const raw = searchValue.value.trim();
  if (!raw) {
    window.$message?.warning("请输入查询值");
    return;
  }
  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) {
    window.$message?.error("必须输入正整数");
    return;
  }
  loading.value = true;
  notFound.value = false;
  record.value = null;
  try {
    const result = await api.get("/v2/admin/anime/episode-start", { params: { laID: num } });
    if (result.data?.code === 200) {
      record.value = result.data.data as Record;
      formManual.value = record.value.episode_start_manual === 1;
      formEpisodeStart.value = record.value.episode_start;
    }
  } catch (error: any) {
    const code = error?.response?.data?.code;
    if (code === 404) {
      notFound.value = true;
    } else {
      window.$message?.error(error?.response?.data?.message ?? "查询失败");
    }
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!record.value) return;
  if (formManual.value && (!formEpisodeStart.value || formEpisodeStart.value < 1)) {
    window.$message?.error("manual 模式下必须提供 >= 1 的整数");
    return;
  }
  saving.value = true;
  try {
    const payload: any = {
      laID: record.value.id,
      manual: formManual.value,
    };
    if (formManual.value) payload.episode_start = formEpisodeStart.value;
    const result = await api.post("/v2/admin/anime/episode-start", payload);
    if (result.data?.code === 200) {
      window.$message?.success("已保存");
      // 重新查询刷新展示
      await search();
    }
  } catch (error: any) {
    window.$message?.error(error?.response?.data?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>