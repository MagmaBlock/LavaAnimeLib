<template>
  <div>
    <div class="mb-6 px-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">概览</div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">管理员仪表盘</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <NCard :bordered="false" class="!rounded-xl">
        <NSpace align="center" :wrap="false">
          <div
            class="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
          >
            <Icon
              icon="fluent:people-24-regular"
              class="text-blue-600 dark:text-blue-400"
              width="22"
              height="22"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {{ statsLoading ? '...' : stats.userCount }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">注册用户</div>
          </div>
        </NSpace>
      </NCard>

      <NCard :bordered="false" class="!rounded-xl">
        <NSpace align="center" :wrap="false">
          <div
            class="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"
          >
            <Icon
              icon="fluent:collections-24-regular"
              class="text-emerald-600 dark:text-emerald-400"
              width="22"
              height="22"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {{ statsLoading ? '...' : stats.animeCount }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">番剧条目</div>
          </div>
        </NSpace>
      </NCard>

      <NCard :bordered="false" class="!rounded-xl">
        <NSpace align="center" :wrap="false">
          <div
            class="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0"
          >
            <Icon
              icon="fluent:key-24-regular"
              class="text-amber-600 dark:text-amber-400"
              width="22"
              height="22"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {{ statsLoading ? '...' : stats.validInviteCodeCount }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">有效邀请码</div>
          </div>
        </NSpace>
      </NCard>

      <NCard :bordered="false" class="!rounded-xl">
        <NSpace align="center" :wrap="false">
          <div
            class="w-11 h-11 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0"
          >
            <Icon
              icon="fluent:eye-24-regular"
              class="text-violet-600 dark:text-violet-400"
              width="22"
              height="22"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {{ statsLoading ? '...' : stats.weekViewCount }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">7 日观看</div>
          </div>
        </NSpace>
      </NCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <NCard title="快捷操作" :bordered="false" class="!rounded-xl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NButton @click="router.push({ name: 'admin-header' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:image-24-regular" width="18" height="18" />
            </template>
            管理主页头图
          </NButton>
          <NButton @click="router.push({ name: 'admin-index-activity' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:megaphone-loud-24-regular" width="18" height="18" />
            </template>
            管理索引页活动
          </NButton>
          <NButton @click="router.push({ name: 'admin-invite' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:key-24-regular" width="18" height="18" />
            </template>
            管理邀请码
          </NButton>
          <NButton @click="router.push({ name: 'admin-drive' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:server-24-regular" width="18" height="18" />
            </template>
            管理存储节点
          </NButton>
          <NButton @click="router.push({ name: 'admin-connection-config' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:plug-connected-24-regular" width="18" height="18" />
            </template>
            管理连接配置
          </NButton>
          <NButton @click="router.push({ name: 'admin-file-index' })" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:search-folder-24-regular" width="18" height="18" />
            </template>
            管理文件索引
          </NButton>
          <NButton @click="router.push({ name: 'index' })" tag="a" target="_blank" class="!justify-start" size="large">
            <template #icon>
              <Icon icon="fluent:open-24-regular" width="18" height="18" />
            </template>
            打开网站首页
          </NButton>
        </div>
      </NCard>

      <NCard title="管理员信息" :bordered="false" class="!rounded-xl">
        <NSpin :show="!userInfo.id">
          <div v-if="userInfo.id" class="space-y-3">
            <div class="flex items-center gap-3">
              <NAvatar
                :src="userInfo.data?.avatar?.url || '/Transparent_Akkarin.jpg'"
                round
                size="large"
              />
              <div>
                <div class="font-semibold text-gray-800 dark:text-gray-200">
                  {{ userInfo.name || userInfo.email }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ userInfo.email }}
                </div>
              </div>
              <NTag type="success" size="small" round class="ml-auto">管理员</NTag>
            </div>
            <NDivider class="!my-2" />
            <div class="text-sm text-gray-500 dark:text-gray-400">
              注册时间：
              {{ userInfo.create_time ? dayjs(userInfo.create_time).format('YYYY-MM-DD HH:mm') : '-' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              用户 ID：{{ userInfo.id }}
            </div>
          </div>
        </NSpin>
      </NCard>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import dayjs from "dayjs";

definePageMeta({
  layout: "admin",
});

useHead({ title: "管理员仪表盘" });

const router = useRouter();
const userStore = useUserStore();

const userInfo = computed(() => (userStore.userInfo as Record<string, any>) || {});

const stats = ref({ userCount: 0, animeCount: 0, validInviteCodeCount: 0, weekViewCount: 0 });
const statsLoading = ref(true);

onMounted(async () => {
  await Promise.allSettled([loadUserInfo(), loadStats()]);
});

async function loadUserInfo() {
  await userStore.getUserInfo();
}

async function loadStats() {
  statsLoading.value = true;
  try {
    const result = await api.get("/v2/admin/stats");
    if (result.data?.code === 200) {
      stats.value = result.data.data;
    }
  } catch (error) {
    console.error("加载统计数据失败", error);
  } finally {
    statsLoading.value = false;
  }
}
</script>
