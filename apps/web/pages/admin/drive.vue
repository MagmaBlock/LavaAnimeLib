<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">存储节点</h1>
    </div>

    <NCard
      :title="`存储节点（${drives.length}）`"
      :bordered="false"
      class="!rounded-xl"
    >
      <template #header-extra>
        <NSpace size="small">
          <NButton size="small" type="primary" @click="openCreateDrawer">
            <template #icon>
              <Icon icon="fluent:add-24-regular" width="16" height="16" />
            </template>
            新建
          </NButton>
          <NButton size="small" @click="loadDrives" :loading="loading">
            <template #icon>
              <Icon icon="fluent:arrow-sync-24-regular" width="16" height="16" />
            </template>
          </NButton>
        </NSpace>
      </template>

      <NSpin :show="loading">
        <NEmpty v-if="!loading && drives.length === 0" description="暂无存储节点" />
        <NDataTable
          v-else
          :columns="columns"
          :data="drives"
          :row-key="rowKey"
          :single-line="false"
          size="small"
          :scroll-x="1100"
        />
      </NSpin>
    </NCard>

    <NDrawer v-model:show="drawerOpen" :width="drawerWidth" placement="right">
      <NDrawerContent :title="editing ? '编辑存储节点' : '新建存储节点'" closable>
        <NForm label-placement="top">
          <NFormItem label="节点 ID" required>
            <NInput v-model:value="form.id" :disabled="editing" placeholder="例如 tky1-openlist" />
          </NFormItem>
          <NFormItem label="名称" required>
            <NInput v-model:value="form.name" placeholder="展示给用户的节点名称" />
          </NFormItem>
          <NFormItem label="描述">
            <NInput v-model:value="form.description" type="textarea" placeholder="节点说明" />
          </NFormItem>
          <NFormItem label="连接配置">
            <NSelect
              v-model:value="form.connectionConfigId"
              :options="connectionConfigOptions"
              placeholder="选择连接配置（可选）"
              clearable
              filterable
            />
          </NFormItem>
          <NFormItem label="排序">
            <NInputNumber v-model:value="form.sortOrder" class="!w-full" />
          </NFormItem>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NFormItem label="限制 NSFW">
              <NSwitch v-model:value="form.banNSFW" />
            </NFormItem>
            <NFormItem label="禁止下载">
              <NSwitch v-model:value="form.disableDownload" />
            </NFormItem>
            <NFormItem label="启用">
              <NSwitch v-model:value="form.enabled" />
            </NFormItem>
            <NFormItem label="默认节点">
              <NSwitch v-model:value="form.isDefault" />
            </NFormItem>
          </div>
        </NForm>

        <template #footer>
          <NSpace justify="end">
            <NButton @click="drawerOpen = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveDrive">
              保存
            </NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { h } from "vue";
import {
  NButton,
  NPopconfirm,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
} from "naive-ui";
import type { DriveRecord, ConnectionConfig } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "存储节点管理" });

type DriveForm = Omit<DriveRecord, "createdAt" | "updatedAt">;

const message = useMessage();
const drives = ref<DriveRecord[]>([]);
const connectionConfigs = ref<ConnectionConfig[]>([]);
const loading = ref(true);
const saving = ref(false);
const drawerOpen = ref(false);
const editing = ref(false);
const drawerWidth = computed(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 520));

const connectionConfigOptions = computed(() =>
  connectionConfigs.value.map((c) => ({
    label: `#${c.id} ${c.type}` + (c.config && typeof c.config === "object" && "host" in c.config ? ` (${(c.config as Record<string, string>).host})` : ""),
    value: c.id,
  }))
);

const emptyForm = (): DriveForm => ({
  id: "",
  name: "",
  description: "",
  connectionConfigId: null,
  banNSFW: false,
  disableDownload: false,
  enabled: true,
  isDefault: false,
  sortOrder: 0,
});

const form = reactive<DriveForm>(emptyForm());

function findConfig(id: number | null): ConnectionConfig | undefined {
  if (id == null) return undefined;
  return connectionConfigs.value.find((c) => c.id === id);
}

const columns: DataTableColumns<DriveRecord> = [
  {
    title: "名称",
    key: "name",
    minWidth: 160,
    render(row: DriveRecord) {
      return h("div", [
        h("div", { class: "font-medium" }, row.name),
        h("div", { class: "text-xs text-gray-400" }, row.id),
      ]);
    },
  },
  {
    title: "连接配置",
    key: "connectionConfigId",
    width: 200,
    ellipsis: { tooltip: true },
    render(row: DriveRecord) {
      const cfg = findConfig(row.connectionConfigId);
      if (!cfg) return h("span", { class: "text-gray-400 text-xs" }, "未配置");
      const host = cfg.config && typeof cfg.config === "object" && "host" in cfg.config
        ? (cfg.config as Record<string, string>).host
        : "-";
      return h("div", [
        h(NTag, { size: "small" }, () => cfg.type),
        h("span", { class: "ml-1 text-xs text-gray-500" }, host),
      ]);
    },
  },
  {
    title: "策略",
    key: "flags",
    width: 210,
    render(row: DriveRecord) {
      return h(NSpace, { size: "small" }, () => [
        row.banNSFW ? h(NTag, { size: "small", type: "warning" }, () => "NSFW") : null,
        row.disableDownload ? h(NTag, { size: "small", type: "error" }, () => "禁止下载") : null,
        row.isDefault ? h(NTag, { size: "small", type: "success" }, () => "默认") : null,
      ]);
    },
  },
  {
    title: "启用",
    key: "enabled",
    width: 90,
    render(row: DriveRecord) {
      return h(NSwitch, {
        value: row.enabled,
        onUpdateValue: (value: boolean) => quickUpdate(row, { enabled: value }),
      });
    },
  },
  {
    title: "排序",
    key: "sortOrder",
    width: 80,
  },
  {
    title: "操作",
    key: "actions",
    width: 240,
    fixed: "right",
    render(row: DriveRecord) {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          {
            size: "tiny",
            secondary: true,
            disabled: row.isDefault,
            onClick: () => setDefault(row.id),
          },
          () => "设默认"
        ),
        h(
          NButton,
          {
            size: "tiny",
            secondary: true,
            onClick: () => openEditDrawer(row),
          },
          () => "编辑"
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => deleteDrive(row.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "tiny",
                  type: "error",
                  secondary: true,
                },
                () => "删除"
              ),
            default: () => "确定删除该存储节点？",
          }
        ),
      ]);
    },
  },
];

function rowKey(row: DriveRecord) {
  return row.id;
}

function resetForm(next: DriveForm) {
  Object.assign(form, next);
}

function openCreateDrawer() {
  editing.value = false;
  resetForm(emptyForm());
  drawerOpen.value = true;
}

function openEditDrawer(row: DriveRecord) {
  editing.value = true;
  resetForm({
    id: row.id,
    name: row.name,
    description: row.description,
    connectionConfigId: row.connectionConfigId,
    banNSFW: row.banNSFW,
    disableDownload: row.disableDownload,
    enabled: row.enabled,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
  });
  drawerOpen.value = true;
}

async function loadConnectionConfigs() {
  try {
    const result = await api.get("/v2/admin/connection-config/all");
    if (result.data?.code === 200) {
      connectionConfigs.value = result.data.data || [];
    }
  } catch (_error) {
    // non-critical
  }
}

async function loadDrives() {
  loading.value = true;
  try {
    await loadConnectionConfigs();
    const result = await api.get("/v2/admin/drive/all");
    if (result.data?.code === 200) {
      drives.value = result.data.data || [];
    }
  } catch (_error) {
    message.error("获取存储节点失败");
  } finally {
    loading.value = false;
  }
}

async function saveDrive() {
  saving.value = true;
  try {
    const url = editing.value ? "/v2/admin/drive/update" : "/v2/admin/drive/new";
    const result = await api.post(url, { ...form });
    if (result.data?.code === 200) {
      message.success(result.data.message || "保存成功");
      drawerOpen.value = false;
      await loadDrives();
    }
  } catch (_error) {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
}

async function quickUpdate(row: DriveRecord, patch: Partial<DriveForm>) {
  try {
    await api.post("/v2/admin/drive/update", {
      id: row.id,
      name: row.name,
      description: row.description,
      connectionConfigId: row.connectionConfigId,
      banNSFW: row.banNSFW,
      disableDownload: row.disableDownload,
      enabled: row.enabled,
      isDefault: row.isDefault,
      sortOrder: row.sortOrder,
      ...patch,
    });
    await loadDrives();
  } catch (_error) {
    message.error("更新失败");
    await loadDrives();
  }
}

async function setDefault(id: string) {
  try {
    const result = await api.post("/v2/admin/drive/set-default", { id });
    if (result.data?.code === 200) {
      message.success("已设为默认节点");
      await loadDrives();
    }
  } catch (_error) {
    message.error("设置默认节点失败");
  }
}

async function deleteDrive(id: string) {
  try {
    const result = await api.post("/v2/admin/drive/delete", { id });
    if (result.data?.code === 200) {
      message.success("删除成功");
      await loadDrives();
    }
  } catch (_error) {
    message.error("删除失败");
  }
}

onMounted(() => {
  loadDrives();
});
</script>
