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
          :row-key="(row: ParsedConfig) => row.id"
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

          <!-- Alist quick config form -->
          <template v-if="form.type === 'alist'">
            <NFormItem label="Host" required>
              <NInput v-model:value="alistHost" placeholder="https://alist.example.com" />
            </NFormItem>
            <NFormItem label="路径" required>
              <NInput v-model:value="alistPath" placeholder="/Anime" />
            </NFormItem>
            <NFormItem label="密码">
              <NInput
                v-model:value="alistPassword"
                type="password"
                show-password-on="click"
                placeholder="目录密码，可留空"
              />
            </NFormItem>
          </template>

          <!-- Generic config form for other types -->
          <div v-else class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
            该驱动类型暂无快捷配置表单，请在下方 JSON 编辑器中编辑。
          </div>

          <!-- Raw JSON editor (collapsible) -->
          <NCollapse>
            <NCollapseItem title="高级：原始 JSON 编辑">
              <div class="text-xs text-gray-400 mb-2">直接编辑连接配置的 JSON 对象</div>
              <NInput
                v-model:value="configText"
                type="textarea"
                :rows="12"
                :status="jsonError ? 'error' : undefined"
                placeholder="{ &quot;host&quot;: &quot;...&quot;, &quot;path&quot;: &quot;...&quot; }"
                class="font-mono text-sm"
              />
              <div v-if="jsonError" class="text-red-500 text-xs mt-1">{{ jsonError }}</div>
            </NCollapseItem>
          </NCollapse>
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
  NCollapse,
  NCollapseItem,
  NPopconfirm,
  NSpace,
  NTag,
  type DataTableColumns,
} from "naive-ui";

definePageMeta({
  layout: "admin",
});

useHead({ title: "连接配置管理" });

interface ParsedConfig {
  id: number;
  type: string;
  config: Record<string, unknown>;
}

interface ConfigForm {
  id: number | null;
  type: string;
  config: Record<string, unknown>;
}

const message = useMessage();
const configs = ref<ParsedConfig[]>([]);
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

const alistDefaults: Record<string, string> = {
  host: "",
  path: "",
  password: "",
};

function parseConfig(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
}

function loadParsedConfigs(rawList: { id: number; type: string; config: unknown }[]): ParsedConfig[] {
  return rawList.map((item) => ({
    id: item.id,
    type: item.type,
    config: parseConfig(item.config),
  }));
}

const emptyForm = (): ConfigForm => ({
  id: null,
  type: "alist",
  config: { ...alistDefaults },
});

const form = reactive<ConfigForm>(emptyForm());

const columns: DataTableColumns<ParsedConfig> = [
  {
    title: "ID",
    key: "id",
    width: 70,
  },
  {
    title: "类型",
    key: "type",
    width: 100,
    render(row: ParsedConfig) {
      return h(NTag, { size: "small" }, () => row.type);
    },
  },
  {
    title: "配置",
    key: "config",
    minWidth: 360,
    ellipsis: { tooltip: true },
    render(row: ParsedConfig) {
      const cfg = row.config;
      const parts: string[] = [];
      if (cfg.host) parts.push(`host: ${cfg.host}`);
      if (cfg.path) parts.push(`path: ${cfg.path}`);
      return h("span", { class: "text-xs font-mono text-gray-600 dark:text-gray-400" }, parts.join("  "));
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    fixed: "right",
    render(row: ParsedConfig) {
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

function readAlistFields(cfg: Record<string, unknown>) {
  alistHost.value = String(cfg.host ?? "");
  alistPath.value = String(cfg.path ?? "");
  alistPassword.value = String(cfg.password ?? "");
}

function buildAlistConfig(): Record<string, unknown> {
  return {
    host: alistHost.value,
    path: alistPath.value,
    password: alistPassword.value,
  };
}

function buildConfigFromForm(): Record<string, unknown> {
  if (form.type === "alist") {
    return buildAlistConfig();
  }
  if (validateJsonRaw()) {
    return JSON.parse(configText.value);
  }
  return form.config;
}

function validateJsonRaw(): boolean {
  jsonError.value = "";
  try {
    const parsed = JSON.parse(configText.value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      jsonError.value = "配置必须是 JSON 对象";
      return false;
    }
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

function syncQuickFormToConfig() {
  if (form.type === "alist") {
    form.config = buildAlistConfig();
  }
}

function onTypeChange() {
  if (form.type === "alist") {
    readAlistFields(form.config);
  }
  syncFormToText();
}

function resetForm(next: ConfigForm) {
  Object.assign(form, next);
  if (form.type === "alist") {
    readAlistFields(form.config);
  }
  syncFormToText();
}

function openCreateDrawer() {
  editing.value = false;
  resetForm(emptyForm());
  drawerOpen.value = true;
}

function openEditDrawer(row: ParsedConfig) {
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
      configs.value = loadParsedConfigs(result.data.data || []);
    }
  } catch (_error) {
    message.error("获取连接配置失败");
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  syncQuickFormToConfig();
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
