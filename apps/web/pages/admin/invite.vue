<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">用户管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">邀请码管理</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-1">
        <NCard title="生成邀请码" :bordered="false" class="!rounded-xl">
          <NForm label-placement="top">
            <NFormItem label="生成数量" required>
              <NInputNumber v-model:value="amount" :min="1" :max="100" class="!w-full" />
            </NFormItem>
            <NFormItem label="开启到期时间">
              <NSwitch v-model:value="timeLimit" />
            </NFormItem>
            <NFormItem label="快速设定几天后失效" v-if="timeLimit">
              <NInputNumber v-model:value="lateDays" :min="1" class="!w-full" />
            </NFormItem>
            <NFormItem label="失效时间" v-if="timeLimit">
              <NDatePicker
                v-model:value="expirationTime"
                type="datetime"
                class="!w-full"
              />
            </NFormItem>
            <NButton
              block
              type="primary"
              :loading="generating"
              @click="send"
            >
              {{ timeLimit ? "生成限时邀请码" : "生成永久邀请码" }}
            </NButton>
          </NForm>
        </NCard>
      </div>

      <div class="lg:col-span-2">
        <NCard
          :title="`有效邀请码（${checkedRowKeys.length > 0 ? `已选 ${checkedRowKeys.length} 项` : allCodes.length}）`"
          :bordered="false"
          class="!rounded-xl"
        >
          <template #header-extra>
            <NSpace size="small">
              <NButton
                v-if="allCodes.length > 0"
                size="small"
                secondary
                @click="copyAllCodes"
              >
                <template #icon>
                  <Icon icon="fluent:clipboard-multiple-24-regular" width="16" height="16" />
                </template>
                复制全部
              </NButton>
              <NPopconfirm
                v-if="checkedRowKeys.length > 0"
                @positive-click="batchDelete"
              >
                <template #trigger>
                  <NButton size="small" type="error" secondary>
                    <template #icon>
                      <Icon icon="fluent:delete-24-regular" width="16" height="16" />
                    </template>
                    删除选中
                  </NButton>
                </template>
                确定删除选中的 {{ checkedRowKeys.length }} 个邀请码？
              </NPopconfirm>
              <NButton size="small" @click="allValidCodes" :loading="loading">
                <template #icon>
                  <Icon icon="fluent:arrow-sync-24-regular" width="16" height="16" />
                </template>
              </NButton>
            </NSpace>
          </template>

          <NSpin :show="loading">
            <NEmpty v-if="!loading && allCodes.length === 0" description="暂无有效的邀请码" />

            <NDataTable
              v-else
              :columns="columns"
              :data="allCodes"
              :row-key="rowKey"
              :checked-row-keys="checkedRowKeys"
              :single-line="false"
              size="small"
              :scroll-x="600"
              max-height="480"
              virtual-scroll
              @update:checked-row-keys="handleCheck"
            />
          </NSpin>
        </NCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { useClipboard } from "@vueuse/core";
import { h } from "vue";
import dayjs from "dayjs";
import {
  NSpace,
  NButton,
  NPopconfirm,
  type DataTableColumns,
} from "naive-ui";

definePageMeta({
  layout: "admin",
});

useHead({ title: "邀请码管理" });

const message = useMessage();
const { copy } = useClipboard();

const amount = ref(1);
const timeLimit = ref(false);
const lateDays = ref(3);
const expirationTime = ref<number | null>(null);
const allCodes = ref<{ code: string; expirationTime: number | null }[]>([]);
const checkedRowKeys = ref<string[]>([]);
const loading = ref(true);
const generating = ref(false);

interface CodeItem {
  code: string;
  expirationTime: number | null;
}

const columns: DataTableColumns<CodeItem> = [
  {
    type: "selection",
  },
  {
    title: "邀请码",
    key: "code",
    ellipsis: { tooltip: true },
  },
  {
    title: "有效期至",
    key: "expirationTime",
    width: 200,
    render(row: CodeItem) {
      return row.expirationTime
        ? h("span", dayjs(row.expirationTime).format("YYYY-MM-DD HH:mm"))
        : h("span", { class: "text-gray-400" }, "永久有效");
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    render(row: CodeItem) {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          {
            size: "tiny",
            secondary: true,
            onClick: () => copyCode(row.code),
          },
          () => "复制"
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => deleteCode(row.code),
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
            default: () => "确定删除该邀请码？",
          }
        ),
      ]);
    },
  },
];

function rowKey(row: { code: string }) {
  return row.code;
}

function handleCheck(keys: string[]) {
  checkedRowKeys.value = keys;
}

function setTimeDays(day: number) {
  expirationTime.value = new Date().getTime() + 1000 * 60 * 60 * 24 * day;
}

async function send() {
  if (amount.value < 1) return;
  generating.value = true;
  try {
    const add = await LavaAnimeAPI.post("/v2/user/invite/new", {
      amount: amount.value,
      expirationTime: timeLimit.value ? expirationTime.value : undefined,
    });
    if (add.data.code === 200) {
      message.success(add.data.message);
      await allValidCodes();
    }
  } catch (_error) {
    message.error("生成邀请码失败");
  } finally {
    generating.value = false;
  }
}

async function allValidCodes() {
  loading.value = true;
  try {
    const result = await LavaAnimeAPI.get("/v2/admin/invite/all-valid-codes");
    if (result.data?.code === 200) {
      allCodes.value = result.data.data || [];
    }
  } catch (_error) {
    message.error("获取邀请码列表失败");
  } finally {
    loading.value = false;
  }
}

async function deleteCode(code: string) {
  try {
    const result = await LavaAnimeAPI.post("/v2/admin/invite/delete-codes", {
      codes: [code],
    });
    if (result.data?.code === 200) {
      message.success("删除成功");
      checkedRowKeys.value = checkedRowKeys.value.filter((k) => k !== code);
    }
  } catch (_error) {
    message.error("删除失败");
  }
  await allValidCodes();
}

async function batchDelete() {
  try {
    const result = await LavaAnimeAPI.post("/v2/admin/invite/delete-codes", {
      codes: checkedRowKeys.value,
    });
    if (result.data?.code === 200) {
      message.success(`成功删除 ${checkedRowKeys.value.length} 个邀请码`);
      checkedRowKeys.value = [];
    }
  } catch (_error) {
    message.error("批量删除失败");
  }
  await allValidCodes();
}

function copyCode(code: string) {
  copy(code);
  message.success("已复制到剪贴板");
}

function copyAllCodes() {
  const text = allCodes.value.map((c) => c.code).join("\n");
  copy(text);
  message.success(`已复制 ${allCodes.value.length} 个邀请码`);
}

watch(lateDays, (day) => {
  setTimeDays(day);
});

onMounted(() => {
  setTimeDays(1);
  allValidCodes();
});
</script>
