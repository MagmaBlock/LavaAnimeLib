<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">连接配置</h1>
    </div>

    <NCard
      :title="`连接配置（${configs.length}）`"
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
          <NButton size="small" @click="loadConfigs" :loading="loading">
            <template #icon>
              <Icon icon="fluent:arrow-sync-24-regular" width="16" height="16" />
            </template>
          </NButton>
        </NSpace>
      </template>

      <NSpin :show="loading">
        <NEmpty v-if="!loading && configs.length === 0" description="暂无连接配置" />
        <NDataTable
          v-else
          :columns="columns"
          :data="configs"
          :row-key="(row: ConnectionConfig) => row.id"
          :single-line="false"
          size="small"
        />
      </NSpin>
    </NCard>

    <NDrawer v-model:show="drawerOpen" :width="drawerWidth" placement="right">
      <NDrawerContent :title="editing ? '编辑连接配置' : '新建连接配置'" closable>
        <NForm label-placement="top">
          <NFormItem label="驱动类型" required>
            <NSelect
              v-model:value="form.type"
              :options="typeOptions"
              placeholder="选择驱动类型"
              @update:value="onTypeChange"
            />
          </NFormItem>
          <NFormItem label="配置 JSON" required>
            <NInput
              v-model:value="configText"
              type="textarea"
              :rows="14"
              :status="jsonError ? 'error' : undefined"
              placeholder="{ &quot;host&quot;: &quot;https://alist.example.com&quot;, &quot;path&quot;: &quot;/Anime&quot; }"
              class="font-mono text-sm"
            />
            <template #feedback>
              <span v-if="jsonError" class="text-red-500 text-xs">{{ jsonError }}</span>
            </template>
          </NFormItem>
          <NFormItem v-if="form.type === 'alist'" label="快捷配置">
            <div class="grid grid-cols-1 gap-3">
              <div>
                <div class="text-xs text-gray-500 mb-1">Host</div>
                <NInput v-model:value="alistHost" placeholder="https://alist.example.com" size="small" />
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">路径</div>
                <NInput v-model:value="alistPath" placeholder="/Anime" size="small" />
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">密码</div>
                <NInput
                  v-model:value="alistPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="目录密码，可留空"
                  size="small"
                />
              </div>
              <NButton size="small" @click="applyAlistQuickConfig">
                应用快捷配置
              </NButton>
            </div>
          </NFormItem>
        </NForm>

        <template #footer>
          <NSpace justify="end">
            <NButton @click="drawerOpen = false">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveConfig">
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
  NTag,
  type DataTableColumns,
} from "naive-ui";
import type { ConnectionConfig } from "@lavaanime/shared";

definePageMeta({
  layout: "admin",
});

useHead({ title: "连接配置管理" });

interface ConfigForm {
  id: number | null;
  type: string;
  config: Record<string, unknown>;
}

const message = useMessage();
const configs = ref<ConnectionConfig[]>([]);
const loading = ref(true);
const saving = ref(false);
const drawerOpen = ref(false);
const editing = ref(false);
const configText = ref("");
const jsonError = ref("");
const alistHost = ref("");
const alistPath = ref("");
const alistPassword = ref("");
const drawerWidth = computed(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 600));

const typeOptions = [
  { label: "AList", value: "alist" },
];

const alistDefaultConfig = {
  host: "https://alist.example.com",
  path: "/Anime",
  password: "",
};

const emptyForm = (): ConfigForm => ({
  id: null,
  type: "alist",
  config: { ...alistDefaultConfig },
});

const form = reactive<ConfigForm>(emptyForm());

const columns: DataTableColumns<ConnectionConfig> = [
  {
    title: "ID",
    key: "id",
    width: 70,
  },
  {
    title: "类型",
    key: "type",
    width: 100,
    render(row: ConnectionConfig) {
      return h(NTag, { size: "small" }, () => row.type);
    },
  },
  {
    title: "配置",
    key: "config",
    minWidth: 320,
    ellipsis: { tooltip: true },
    render(row: ConnectionConfig) {
      const config = row.config;
      if (!config || typeof config !== "object") return h("span", { class: "text-gray-400" }, "-");
      const cfg = config as Record<string, unknown>;
      const parts: string[] = [];
      if ("host" in cfg) parts.push(`host: ${cfg.host}`);
      if ("path" in cfg) parts.push(`path: ${cfg.path}`);
      return h("span", { class: "text-xs font-mono text-gray-600 dark:text-gray-400" }, parts.join("  "));
    },
  },
  {
    title: "完整 JSON",
    key: "configJson",
    minWidth: 200,
    ellipsis: { tooltip: true },
    render(row: ConnectionConfig) {
      return h(
        "code",
        { class: "text-xs text-gray-500 dark:text-gray-500" },
        JSON.stringify(row.config),
      );
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    fixed: "right",
    render(row: ConnectionConfig) {
      return h(NSpace, { size: "small" }, () => [
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
            onPositiveClick: () => deleteConfig(row.id),
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
            default: () => "确定删除该连接配置？正在被引用的配置无法删除。",
          }
        ),
      ]);
    },
  },
];

function validateJson(): boolean {
  try {
    const parsed = JSON.parse(configText.value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      jsonError.value = "配置必须是 JSON 对象";
      return false;
    }
    form.config = parsed as Record<string, unknown>;
    jsonError.value = "";
    return true;
  } catch {
    jsonError.value = "JSON 格式无效";
    return false;
  }
}

function syncFormToText() {
  configText.value = JSON.stringify(form.config, null, 2);
  jsonError.value = "";
}

function onTypeChange() {
  if (form.type === "alist") {
    alistHost.value = (form.config as Record<string, string>).host || "";
    alistPath.value = (form.config as Record<string, string>).path || "";
    alistPassword.value = (form.config as Record<string, string>).password || "";
  }
  syncFormToText();
}

function applyAlistQuickConfig() {
  form.config = {
    host: alistHost.value,
    path: alistPath.value,
    password: alistPassword.value,
  };
  syncFormToText();
}

function resetForm(next: ConfigForm) {
  Object.assign(form, next);
  if (form.type === "alist") {
    alistHost.value = (form.config as Record<string, string>).host || "";
    alistPath.value = (form.config as Record<string, string>).path || "";
    alistPassword.value = (form.config as Record<string, string>).password || "";
  }
  syncFormToText();
}

function openCreateDrawer() {
  editing.value = false;
  const def = emptyForm();
  resetForm(def);
  drawerOpen.value = true;
}

function openEditDrawer(row: ConnectionConfig) {
  editing.value = true;
  resetForm({
    id: row.id,
    type: row.type,
    config: row.config || {},
  });
  drawerOpen.value = true;
}

async function loadConfigs() {
  loading.value = true;
  try {
    const result = await api.get("/v2/admin/connection-config/all");
    if (result.data?.code === 200) {
      configs.value = result.data.data || [];
    }
  } catch (_error) {
    message.error("获取连接配置失败");
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (!validateJson()) return;
  saving.value = true;
  try {
    const url = editing.value
      ? "/v2/admin/connection-config/update"
      : "/v2/admin/connection-config/new";
    const body = editing.value
      ? { id: form.id, type: form.type, config: form.config }
      : { type: form.type, config: form.config };
    const result = await api.post(url, body);
    if (result.data?.code === 200) {
      message.success(result.data.message || "保存成功");
      drawerOpen.value = false;
      await loadConfigs();
    }
  } catch (_error) {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
}

async function deleteConfig(id: number) {
  try {
    const result = await api.post("/v2/admin/connection-config/delete", { id });
    if (result.data?.code === 200) {
      message.success("删除成功");
      await loadConfigs();
    }
  } catch (_error) {
    message.error("删除失败，可能仍有存储节点或端点引用此配置");
  }
}

onMounted(() => {
  loadConfigs();
});
</script>
