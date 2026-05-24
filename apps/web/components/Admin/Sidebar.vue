<template>
  <div class="flex flex-col h-full">
    <div class="py-5 px-5 flex items-center gap-3">
      <NuxtLink to="/" class="shrink-0">
        <img
          src="/icon.svg"
          alt="Logo"
          class="w-9 h-9 rounded-lg active:brightness-90 active:scale-95 transition"
        />
      </NuxtLink>
      <div>
        <div class="text-base font-semibold text-gray-800 dark:text-gray-200 leading-tight">
          管理员后台
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500 leading-tight">
          LavaAnime Admin
        </div>
      </div>
    </div>
    <NDivider class="!my-0" />
    <NMenu
      :value="activeKey"
      :expanded-keys="expandedKeys"
      :options="menuOptions"
      @update:value="handleMenuClick"
      @update:expanded-keys="handleExpandedKeys"
      class="flex-1"
    />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { h } from "vue";

const route = useRoute();
const router = useRouter();
const emit = defineEmits<{ navigate: [] }>();

function renderIcon(icon: string) {
  return () => h(Icon, { icon });
}

const menuOptions = [
  {
    label: "仪表盘",
    key: "admin",
    icon: renderIcon("fluent:board-24-regular"),
  },
  {
    type: "divider" as const,
    key: "d1",
  },
  {
    label: "内容管理",
    key: "content-group",
    icon: renderIcon("fluent:collections-24-regular"),
    children: [
      { label: "主页头图", key: "admin-header" },
      { label: "索引页活动", key: "admin-index-activity" },
      { label: "存储节点", key: "admin-drive" },
    ],
  },
  {
    type: "divider" as const,
    key: "d2",
  },
  {
    label: "用户管理",
    key: "admin-user",
    icon: renderIcon("fluent:people-24-regular"),
  },
  {
    type: "divider" as const,
    key: "d3",
  },
  {
    label: "邀请码管理",
    key: "admin-invite",
    icon: renderIcon("fluent:key-24-regular"),
  },
];

const expandedKeys = ref(["content-group"]);

const activeKey = computed(() => {
  return (route.name as string) ?? null;
});

function handleMenuClick(key: string) {
  if (key === "content-group") return;
  router.push({ name: key });
  emit("navigate");
}

function handleExpandedKeys(keys: string[]) {
  expandedKeys.value = keys;
}
</script>
