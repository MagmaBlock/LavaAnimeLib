<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">用户管理</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">用户列表</h1>
    </div>

    <NCard :bordered="false" class="!rounded-xl">
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="userList"
          :row-key="rowKey"
          :single-line="false"
          size="small"
          :scroll-x="800"
          max-height="640"
          :pagination="false"
        />
        <template #empty>
          <NEmpty description="暂无用户数据" />
        </template>
        <div v-if="total > 0" class="flex justify-end mt-4">
          <NPagination
            v-model:page="page"
            :page-size="pageSize"
            :item-count="total"
            :page-sizes="[10, 20, 50]"
            show-size-picker
            @update:page="fetchUsers"
            @update:page-size="handlePageSizeChange"
          >
            <template #prefix>
              共 {{ total }} 人
            </template>
          </NPagination>
        </div>
      </NSpin>
    </NCard>

    <NModal v-model:show="showPasswordModal" preset="dialog" title="修改用户密码" positive-text="确认修改" @positive-click="submitPasswordChange">
      <NForm label-placement="top">
        <NFormItem label="用户">
          <NInput :value="`${selectedUser?.name || '—'}（${selectedUser?.email || '—'}）`" disabled />
        </NFormItem>
        <NFormItem label="新密码" required>
          <NInput v-model:value="newPassword" type="password" placeholder="输入新密码" :minlength="7" :maxlength="64" />
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { h } from "vue";
import dayjs from "dayjs";
import {
  NButton,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NPagination,
  type DataTableColumns,
} from "naive-ui";

definePageMeta({
  layout: "admin",
});

useHead({ title: "用户管理" });

const message = useMessage();

interface UserItem {
  id: number;
  email: string;
  name: string;
  create_time: string | null;
  data: { permission?: { admin?: boolean; invite?: boolean }; [key: string]: unknown } | null;
}

const userList = ref<UserItem[]>([]);
const loading = ref(true);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const showPasswordModal = ref(false);
const selectedUser = ref<UserItem | null>(null);
const newPassword = ref("");

const columns: DataTableColumns<UserItem> = [
  {
    title: "ID",
    key: "id",
    width: 80,
  },
  {
    title: "昵称",
    key: "name",
    width: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: "邮箱",
    key: "email",
    width: 220,
    ellipsis: { tooltip: true },
  },
  {
    title: "权限",
    key: "permission",
    width: 160,
    render(row: UserItem) {
      const tags: ReturnType<typeof h>[] = [];
      if (row.data?.permission?.admin) {
        tags.push(h(NTag, { type: "error", size: "small", round: true, class: "mr-1" }, () => "管理员"));
      }
      if (row.data?.permission?.invite) {
        tags.push(h(NTag, { type: "info", size: "small", round: true, class: "mr-1" }, () => "邀请权限"));
      }
      if (tags.length === 0) {
        return h("span", { class: "text-gray-400" }, "普通用户");
      }
      return h("div", { class: "flex flex-wrap gap-1" }, tags);
    },
  },
  {
    title: "注册时间",
    key: "create_time",
    width: 180,
    render(row: UserItem) {
      return row.create_time
        ? h("span", dayjs(row.create_time).format("YYYY-MM-DD HH:mm"))
        : h("span", { class: "text-gray-400" }, "—");
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    fixed: "right",
    render(row: UserItem) {
      return h(
        NButton,
        {
          size: "tiny",
          secondary: true,
          onClick: () => openPasswordModal(row),
        },
        { icon: () => h(Icon, { icon: "fluent:key-reset-24-regular", width: "14", height: "14" }), default: () => "改密" }
      );
    },
  },
];

function rowKey(row: UserItem) {
  return row.id;
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps;
  page.value = 1;
  fetchUsers();
}

function openPasswordModal(row: UserItem) {
  selectedUser.value = row;
  newPassword.value = "";
  showPasswordModal.value = true;
}

async function submitPasswordChange() {
  if (!selectedUser.value) return;
  if (!newPassword.value || newPassword.value.length < 7) {
    message.error("密码至少 7 位");
    return;
  }
  if (!/[a-zA-Z]/.test(newPassword.value)) {
    message.error("密码需包含字母");
    return;
  }

  try {
    const result = await LavaAnimeAPI.post("/v2/user/admin-change-password", {
      userID: selectedUser.value.id,
      password: newPassword.value,
    });
    if (result.data?.code === 200) {
      message.success("密码修改成功");
      showPasswordModal.value = false;
    } else {
      message.error(result.data?.message || "修改失败");
    }
  } catch (_error) {
    message.error("修改密码失败");
  }
}

async function fetchUsers() {
  loading.value = true;
  try {
    const result = await LavaAnimeAPI.get("/v2/user/list", {
      params: { page: page.value, pageSize: pageSize.value },
    });
    if (result.data?.code === 200) {
      userList.value = result.data.data.list || [];
      total.value = result.data.data.total || 0;
    }
  } catch (_error) {
    message.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchUsers();
});
</script>
