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

    <NDrawer v-model:show="drawerOpen" :width="drawerWidth" placement="right">
      <NDrawerContent :title="editing ? '编辑存储节点' : '新建存储节点'" closable>
        <NForm label-placement="top">
          <NFormItem label="节点 ID" required>
            <NInput v-model:value="form.id" :disabled="editing" placeholder="例如 tky1" />
          </NFormItem>
          <NFormItem label="名称" required>
            <NInput v-model:value="form.name" placeholder="展示给用户的节点名称" />
          </NFormItem>
          <NFormItem label="描述">
            <NInput v-model:value="form.description" type="textarea" placeholder="节点说明" />
          </NFormItem>
          <NFormItem label="驱动类型" required>
            <NSelect
              v-model:value="form.type"
              :options="driverTypeOptions"
              placeholder="选择文件系统驱动类型"
            />
          </NFormItem>
          <NDivider>连接配置</NDivider>
          <NFormItem label="Host" required>
            <NInput v-model:value="configForm.host" placeholder="https://alist.example.com" />
          </NFormItem>
          <NFormItem label="Path" required>
            <NInput v-model:value="configForm.path" placeholder="/Anime" />
          </NFormItem>
          <NFormItem label="Password">
            <NInput v-model:value="configForm.password" placeholder="AList 密码（可选）" />
          </NFormItem>
          <NFormItem label="Token">
            <NInput v-model:value="configForm.token" placeholder="AList Token，用于服务端自签名（可选）" />
          </NFormItem>
          <NFormItem label="签名过期时间（小时）">
            <NInputNumber v-model:value="configForm.signExpireHours" :min="0" class="!w-full" placeholder="0 = 永不过期" />
          </NFormItem>
          <NDivider>策略</NDivider>
          <NFormItem label="排序">
            <NInputNumber v-model:value="form.sortOrder" class="!w-full" />
          </NFormItem>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NFormItem label="启用">
              <NSwitch v-model:value="form.enabled" />
            </NFormItem>
            <NFormItem label="默认节点">
              <NSwitch v-model:value="form.isDefault" />
            </NFormItem>
            <NFormItem label="禁止 NSFW">
              <NSwitch v-model:value="form.banNSFW" />
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

    <NModal v-model:show="endpointEditModal" preset="card" :title="editingEndpointId ? '编辑对外节点' : '新建对外节点'" class="!max-w-md">
      <NForm label-placement="top">
        <NFormItem label="线路名称" required>
          <NInput v-model:value="endpointForm.name" placeholder="例如 电信直连、本机转发" />
        </NFormItem>
        <NDivider>覆写连接配置（可选）</NDivider>
        <div class="text-xs text-gray-400 mb-3">覆写存储节点的连接配置。留空则沿用节点默认配置。</div>
        <NFormItem label="Host 覆写">
          <NInput v-model:value="endpointOverrideForm.host" placeholder="留空沿用节点 Host" />
        </NFormItem>
        <NFormItem label="Path 覆写">
          <NInput v-model:value="endpointOverrideForm.path" placeholder="留空沿用节点 Path，例如 /od1-proxy" />
        </NFormItem>
        <NFormItem label="Token 覆写">
          <NInput v-model:value="endpointOverrideForm.token" placeholder="留空沿用节点 Token" />
        </NFormItem>
        <NFormItem label="签名过期时间覆写">
          <NInputNumber v-model:value="endpointOverrideForm.signExpireHours" :min="0" class="!w-full" placeholder="留空沿用节点设置" />
        </NFormItem>
        <NDivider>策略</NDivider>
        <div class="grid grid-cols-2 gap-3">
          <NFormItem label="优先级">
            <NInputNumber v-model:value="endpointForm.priority" class="!w-full" :min="0" />
          </NFormItem>
          <NFormItem label="启用">
            <div class="h-9 flex items-center">
              <NSwitch v-model:value="endpointForm.enabled" />
            </div>
          </NFormItem>
          <NFormItem label="限制 NSFW">
            <NSwitch v-model:value="endpointForm.banNSFW" />
          </NFormItem>
          <NFormItem label="禁止下载">
            <NSwitch v-model:value="endpointForm.disableDownload" />
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
  NDivider,
  NPopconfirm,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
} from "naive-ui";
import type { DriveRecord, EndpointRecord, AlistDriveConfig, DriveConfigOverride } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "存储节点管理" });

interface DriveForm {
  id: string;
  name: string;
  description: string;
  type: string;
  config: AlistDriveConfig;
  banNSFW: boolean;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface DriveConfigForm {
  host: string;
  path: string;
  password: string;
  token: string;
  signExpireHours: number;
}

interface EndpointForm {
  id: number | null;
  driveId: string;
  name: string;
  configOverride: DriveConfigOverride | null;
  priority: number;
  enabled: boolean;
  banNSFW: boolean;
  disableDownload: boolean;
}

interface EndpointOverrideForm {
  host: string;
  path: string;
  password: string;
  token: string;
  signExpireHours: number | null;
}

const driverTypeOptions = [
  { label: "AList", value: "alist" },
];

const message = useMessage();
const drives = ref<DriveRecord[]>([]);
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
  configOverride: null,
  priority: 0,
  enabled: true,
  banNSFW: false,
  disableDownload: false,
});
const endpointForm = reactive<EndpointForm>(emptyEndpointForm());

const emptyEndpointOverride = (): EndpointOverrideForm => ({
  host: "",
  path: "",
  password: "",
  token: "",
  signExpireHours: null,
});
const endpointOverrideForm = reactive<EndpointOverrideForm>(emptyEndpointOverride());

function configToOverride(): DriveConfigOverride | null {
  const host = endpointOverrideForm.host.trim();
  const path = endpointOverrideForm.path.trim();
  const password = endpointOverrideForm.password.trim();
  const token = endpointOverrideForm.token.trim();
  const signExpireHours = endpointOverrideForm.signExpireHours;
  if (!host && !path && !password && !token && signExpireHours === null) return null;
  const result: DriveConfigOverride = {};
  if (host) result.host = host;
  if (path) result.path = path;
  if (password) result.password = password;
  if (token) result.token = token;
  if (signExpireHours != null) result.signExpireHours = signExpireHours;
  return result;
}

function overrideToForm(override: DriveConfigOverride | null) {
  if (!override) {
    Object.assign(endpointOverrideForm, emptyEndpointOverride());
    return;
  }
  endpointOverrideForm.host = override.host ?? "";
  endpointOverrideForm.path = override.path ?? "";
  endpointOverrideForm.password = override.password ?? "";
  endpointOverrideForm.token = override.token ?? "";
  endpointOverrideForm.signExpireHours = override.signExpireHours ?? null;
}

const emptyForm = (): DriveForm => ({
  id: "",
  name: "",
  description: "",
  type: "alist",
  config: { host: "", path: "", password: "", token: "", signExpireHours: 0 },
  banNSFW: false,
  enabled: true,
  isDefault: false,
  sortOrder: 0,
});

const form = reactive<DriveForm>(emptyForm());

function parseDriveConfig(config: AlistDriveConfig): DriveConfigForm {
  return {
    host: config.host,
    path: config.path,
    password: config.password,
    token: config.token ?? "",
    signExpireHours: config.signExpireHours ?? 0,
  };
}

function buildDriveConfig(): AlistDriveConfig {
  return {
    host: configForm.host.trim(),
    path: configForm.path.trim(),
    password: configForm.password.trim(),
    token: configForm.token.trim() || undefined,
    signExpireHours: configForm.signExpireHours || undefined,
  };
}

const configForm = reactive<DriveConfigForm>(parseDriveConfig(emptyForm().config));

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
    title: "驱动",
    key: "type",
    width: 80,
    render(row: DriveRecord) {
      return h(NTag, { size: "small" }, () => row.type);
    },
  },
  {
    title: "Host",
    key: "host",
    width: 200,
    ellipsis: { tooltip: true },
    render(row: DriveRecord) {
      return h("span", { class: "text-xs" }, row.config.host);
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
    width: 120,
    render(row: DriveRecord) {
      return h(NSpace, { size: "small" }, () => [
        row.isDefault ? h(NTag, { size: "small", type: "success" }, () => "默认") : null,
        row.banNSFW ? h(NTag, { size: "small", type: "warning" }, () => "NSFW") : null,
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
    title: "覆写配置",
    key: "override",
    width: 200,
    ellipsis: { tooltip: true },
    render(row: EndpointRecord) {
      const ov = row.configOverride;
      if (!ov) return h("span", { class: "text-gray-400 text-xs" }, "无覆写");
      const parts: string[] = [];
      if (ov.host) parts.push(`Host: ${ov.host}`);
      if (ov.path) parts.push(`Path: ${ov.path}`);
      return h("div", { class: "text-xs" }, parts.length > 0 ? parts.join(" / ") : "无覆写");
    },
  },
  {
    title: "优先级",
    key: "priority",
    width: 70,
  },
  {
    title: "策略",
    key: "endpointFlags",
    width: 120,
    render(row: EndpointRecord) {
      return h(NSpace, { size: "small" }, () => [
        row.banNSFW ? h(NTag, { size: "small", type: "warning" }, () => "NSFW") : null,
        row.disableDownload ? h(NTag, { size: "small", type: "error" }, () => "禁止下载") : null,
      ]);
    },
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
  const cfg = parseDriveConfig(next.config);
  configForm.host = cfg.host;
  configForm.path = cfg.path;
  configForm.password = cfg.password;
  configForm.token = cfg.token;
  configForm.signExpireHours = cfg.signExpireHours;
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
    type: row.type,
    config: row.config,
    banNSFW: row.banNSFW,
    enabled: row.enabled,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
  });
  drawerOpen.value = true;
}

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
  });
  Object.assign(endpointOverrideForm, emptyEndpointOverride());
  endpointEditModal.value = true;
}

function openEditEndpoint(row: EndpointRecord) {
  editingEndpointId.value = row.id;
  Object.assign(endpointForm, {
    id: row.id,
    driveId: row.driveId,
    name: row.name,
    configOverride: row.configOverride,
    priority: row.priority,
    enabled: row.enabled,
    banNSFW: row.banNSFW,
    disableDownload: row.disableDownload,
  });
  overrideToForm(row.configOverride);
  endpointEditModal.value = true;
}

async function saveEndpoint() {
  if (!endpointForm.name.trim()) {
    message.warning("线路名称不能为空");
    return;
  }
  endpointSaving.value = true;
  try {
    const url = editingEndpointId.value
      ? "/v2/admin/drive/endpoint/update"
      : "/v2/admin/drive/endpoint/new";
    const body = {
      ...endpointForm,
      configOverride: configToOverride(),
    };
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
      configOverride: row.configOverride,
      priority: row.priority,
      enabled: row.enabled,
      banNSFW: row.banNSFW,
      disableDownload: row.disableDownload,
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

async function loadDrives() {
  loading.value = true;
  try {
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
    const result = await api.post(url, {
      ...form,
      config: buildDriveConfig(),
    });
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
      type: row.type,
      config: row.config,
      banNSFW: row.banNSFW,
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
