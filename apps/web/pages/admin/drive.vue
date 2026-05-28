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
          :scroll-x="1200"
        />
      </NSpin>
    </NCard>

    <!-- 存储节点编辑 Drawer -->
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
          <NFormItem label="扫盘连接" required>
            <div class="text-xs text-gray-400 mb-1">该存储节点用于扫描文件索引的内部连接配置</div>
            <NSelect
              v-model:value="form.connectionConfigId"
              :options="connectionConfigOptions"
              placeholder="选择扫盘使用的连接配置"
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

    <!-- 对外节点管理 Drawer -->
    <NDrawer v-model:show="endpointDrawerOpen" :width="drawerWidth" placement="right">
      <NDrawerContent :title="`对外节点 — ${currentDriveName}`" closable>
        <div class="mb-4">
          <NButton size="small" type="primary" @click="openCreateEndpoint">
            <template #icon>
              <Icon icon="fluent:add-24-regular" width="16" height="16" />
            </template>
            新增对外节点
          </NButton>
        </div>

        <NDataTable
          :columns="endpointColumns"
          :data="endpoints"
          :row-key="(row: EndpointRecord) => row.id"
          :single-line="false"
          size="small"
          :scroll-x="800"
        />
        <NEmpty v-if="!endpointsLoading && endpoints.length === 0" description="暂无对外节点" />

        <template #footer>
          <NSpace justify="end">
            <NButton @click="endpointDrawerOpen = false">关闭</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>

    <!-- 对外节点编辑 Modal -->
    <NModal v-model:show="endpointEditModal" preset="card" :title="editingEndpointId ? '编辑对外节点' : '新建对外节点'" class="!max-w-md">
      <NForm label-placement="top">
        <NFormItem label="线路名称" required>
          <NInput v-model:value="endpointForm.name" placeholder="例如 电信、海外" />
        </NFormItem>
        <NFormItem label="对外地址 (URL)">
          <NInput v-model:value="endpointForm.url" placeholder="https://public.example.com" />
        </NFormItem>
        <NFormItem label="对外连接" required>
          <div class="text-xs text-gray-400 mb-1">该对外节点用于构造下载链接的连接配置</div>
          <NSelect
            v-model:value="endpointForm.connectionConfigId"
            :options="connectionConfigOptions"
            placeholder="选择对外使用的连接配置"
            filterable
          />
        </NFormItem>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="优先级">
            <NInputNumber v-model:value="endpointForm.priority" class="!w-full" :min="0" />
          </NFormItem>
          <NFormItem label="启用">
            <div class="h-9 flex items-center">
              <NSwitch v-model:value="endpointForm.enabled" />
            </div>
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="endpointEditModal = false">取消</NButton>
          <NButton type="primary" :loading="endpointSaving" @click="saveEndpoint">
            保存
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
  NPopconfirm,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
} from "naive-ui";
import type { DriveRecord, ConnectionConfig, EndpointRecord } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "存储节点管理" });

type DriveForm = Omit<DriveRecord, "createdAt" | "updatedAt">;

interface EndpointForm {
  id: number | null;
  driveId: string;
  name: string;
  url: string;
  connectionConfigId: number | null;
  priority: number;
  enabled: boolean;
}

const message = useMessage();
const drives = ref<DriveRecord[]>([]);
const connectionConfigs = ref<ConnectionConfig[]>([]);
const loading = ref(true);
const saving = ref(false);
const drawerOpen = ref(false);
const editing = ref(false);
const drawerWidth = computed(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 560));

const endpoints = ref<EndpointRecord[]>([]);
const endpointsLoading = ref(false);
const endpointDrawerOpen = ref(false);
const endpointEditModal = ref(false);
const endpointSaving = ref(false);
const editingEndpointId = ref<number | null>(null);
const currentDriveId = ref("");
const currentDriveName = ref("");

const emptyEndpointForm = (): EndpointForm => ({
  id: null,
  driveId: "",
  name: "",
  url: "",
  connectionConfigId: null,
  priority: 0,
  enabled: true,
});
const endpointForm = reactive<EndpointForm>(emptyEndpointForm());

const connectionConfigOptions = computed(() =>
  connectionConfigs.value.map((c) => ({
    label: `#${c.id} ${c.type} — ${configSummary(c)}`,
    value: c.id,
  }))
);

function parseConfigObj(c: ConnectionConfig): Record<string, unknown> {
  const raw = c.config;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function configSummary(c: ConnectionConfig): string {
  const cfg = parseConfigObj(c);
  if (cfg.host) return String(cfg.host);
  if (cfg.path) return String(cfg.path);
  return JSON.stringify(cfg).slice(0, 40);
}

function findConfig(id: number | null): ConnectionConfig | undefined {
  if (id == null) return undefined;
  return connectionConfigs.value.find((c) => c.id === id);
}

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

const columns: DataTableColumns<DriveRecord> = [
  {
    title: "名称",
    key: "name",
    minWidth: 150,
    render(row: DriveRecord) {
      return h("div", [
        h("div", { class: "font-medium" }, row.name),
        h("div", { class: "text-xs text-gray-400" }, row.id),
      ]);
    },
  },
  {
    title: "扫盘连接",
    key: "scanConfig",
    width: 200,
    ellipsis: { tooltip: true },
    render(row: DriveRecord) {
      const cfg = findConfig(row.connectionConfigId);
      if (!cfg) return h("span", { class: "text-gray-400 text-xs" }, "未配置");
      return h("div", { class: "text-xs" }, [
        h(NTag, { size: "small" }, () => cfg.type),
        h("span", { class: "ml-1 text-gray-500" }, configSummary(cfg)),
      ]);
    },
  },
  {
    title: "对外节点",
    key: "endpoints",
    width: 120,
    render(row: DriveRecord) {
      return h(
        NButton,
        {
          size: "tiny",
          secondary: true,
          onClick: () => openEndpointDrawer(row),
        },
        () => "管理"
      );
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
    width: 80,
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
    width: 70,
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
            default: () => "确定删除该存储节点？关联的对外节点将一并删除。",
          }
        ),
      ]);
    },
  },
];

const endpointColumns: DataTableColumns<EndpointRecord> = [
  {
    title: "线路名称",
    key: "name",
    width: 120,
  },
  {
    title: "对外连接",
    key: "connection",
    width: 220,
    ellipsis: { tooltip: true },
    render(row: EndpointRecord) {
      const cfg = findConfig(row.connectionConfigId);
      if (!cfg) return h("span", { class: "text-gray-400 text-xs" }, "未配置");
      return h("div", { class: "text-xs" }, [
        h(NTag, { size: "small" }, () => cfg.type),
        h("span", { class: "ml-1 text-gray-500" }, configSummary(cfg)),
      ]);
    },
  },
  {
    title: "对外 URL",
    key: "url",
    width: 200,
    ellipsis: { tooltip: true },
    render(row: EndpointRecord) {
      return row.url || h("span", { class: "text-gray-400" }, "—");
    },
  },
  {
    title: "优先级",
    key: "priority",
    width: 70,
  },
  {
    title: "启用",
    key: "enabled",
    width: 80,
    render(row: EndpointRecord) {
      return h(NSwitch, {
        value: row.enabled,
        onUpdateValue: (value: boolean) => quickUpdateEndpoint(row, { enabled: value }),
      });
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 140,
    render(row: EndpointRecord) {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          { size: "tiny", secondary: true, onClick: () => openEditEndpoint(row) },
          () => "编辑"
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => deleteEndpoint(row.id) },
          {
            trigger: () =>
              h(NButton, { size: "tiny", type: "error", secondary: true }, () => "删除"),
            default: () => "确定删除该对外节点？",
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

// ── Endpoints ──

async function openEndpointDrawer(row: DriveRecord) {
  currentDriveId.value = row.id;
  currentDriveName.value = row.name;
  endpointDrawerOpen.value = true;
  await loadEndpoints();
}

async function loadEndpoints() {
  endpointsLoading.value = true;
  try {
    const result = await api.get("/v2/admin/drive/endpoint/list", {
      params: { driveId: currentDriveId.value },
    });
    if (result.data?.code === 200) {
      endpoints.value = result.data.data || [];
    }
  } catch (_error) {
    message.error("获取对外节点列表失败");
  } finally {
    endpointsLoading.value = false;
  }
}

function openCreateEndpoint() {
  editingEndpointId.value = null;
  Object.assign(endpointForm, {
    ...emptyEndpointForm(),
    driveId: currentDriveId.value,
    connectionConfigId: null,
  });
  endpointEditModal.value = true;
}

function openEditEndpoint(row: EndpointRecord) {
  editingEndpointId.value = row.id;
  Object.assign(endpointForm, {
    id: row.id,
    driveId: row.driveId,
    name: row.name,
    url: row.url,
    connectionConfigId: row.connectionConfigId,
    priority: row.priority,
    enabled: row.enabled,
  });
  endpointEditModal.value = true;
}

async function saveEndpoint() {
  endpointSaving.value = true;
  try {
    const url = editingEndpointId.value
      ? "/v2/admin/drive/endpoint/update"
      : "/v2/admin/drive/endpoint/new";
    const body = { ...endpointForm };
    const result = await api.post(url, body);
    if (result.data?.code === 200) {
      message.success(result.data.message || "保存成功");
      endpointEditModal.value = false;
      await loadEndpoints();
    }
  } catch (_error) {
    message.error("保存失败");
  } finally {
    endpointSaving.value = false;
  }
}

async function quickUpdateEndpoint(row: EndpointRecord, patch: Partial<EndpointForm>) {
  try {
    await api.post("/v2/admin/drive/endpoint/update", {
      id: row.id,
      driveId: row.driveId,
      name: row.name,
      url: row.url,
      connectionConfigId: row.connectionConfigId,
      priority: row.priority,
      enabled: row.enabled,
      ...patch,
    });
    await loadEndpoints();
  } catch (_error) {
    message.error("更新失败");
    await loadEndpoints();
  }
}

async function deleteEndpoint(id: number) {
  try {
    const result = await api.post("/v2/admin/drive/endpoint/delete", { id });
    if (result.data?.code === 200) {
      message.success("删除成功");
      await loadEndpoints();
    }
  } catch (_error) {
    message.error("删除失败");
  }
}

// ── Drives CRUD ──

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
