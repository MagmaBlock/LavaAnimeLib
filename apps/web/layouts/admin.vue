<template>
  <div class="flex max-w-[2560px] mx-auto">
    <NavBar class="fixed h-screen z-50" />
    <div class="lg:pl-[84px] w-full h-screen">
      <NLayout has-sider class="h-full">
        <!-- 桌面端侧边栏 -->
        <NLayoutSider
          v-if="!isMobile && canAccessAdmin"
          bordered
          collapse-mode="transform"
          :collapsed-width="0"
          :width="240"
          :native-scrollbar="false"
          show-trigger="bar"
          class="z-40"
        >
          <AdminSidebar />
        </NLayoutSider>

        <!-- 移动端全宽抽屉 -->
        <NDrawer
          v-if="isMobile && canAccessAdmin"
          :show="drawerOpen"
          :width="'100%'"
          placement="left"
          :z-index="40"
          @update:show="drawerOpen = $event"
        >
          <AdminSidebar @navigate="drawerOpen = false" />
        </NDrawer>

        <NLayoutContent>
          <NScrollbar>
            <div class="px-4 pt-4 pb-44 md:px-6 md:pt-6 lg:p-8">
              <div v-if="checkingAdminAccess" class="grid h-[60vh] place-items-center">
                <NSpin size="large" />
              </div>
              <NuxtPage v-else-if="canAccessAdmin" />
            </div>
          </NScrollbar>
        </NLayoutContent>
      </NLayout>

      <!-- 移动端悬浮菜单按钮 -->
      <NFloatButton
        v-if="isMobile && canAccessAdmin"
        :bottom="104"
        :right="16"
        shape="square"
        type="default"
        class="mobile-admin-menu-button"
        @click="drawerOpen = !drawerOpen"
      >
        <Icon icon="fluent:navigation-24-regular" width="22" height="22" />
      </NFloatButton>
    </div>

    <BackgroundProvider />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";

const router = useRouter();
const userStore = useUserStore();

const isMobile = ref(typeof window !== "undefined" ? window.innerWidth < 1024 : false);
const drawerOpen = ref(false);
const checkingAdminAccess = ref(true);
const canAccessAdmin = ref(false);

type UserInfoLike = {
  id?: number | string;
  data?: {
    permission?: {
      admin?: boolean;
    };
  };
};

function updateLayout() {
  isMobile.value = window.innerWidth < 1024;
}

async function checkAdminAccess() {
  checkingAdminAccess.value = true;
  const userInfo = (await userStore.getUserInfo()) as UserInfoLike;

  if (!userInfo?.id) {
    canAccessAdmin.value = false;
    drawerOpen.value = false;
    await router.replace({ path: "/auth/login" });
    checkingAdminAccess.value = false;
    return;
  }

  if (!userInfo.data?.permission?.admin) {
    canAccessAdmin.value = false;
    drawerOpen.value = false;
    window.$message?.error("没有管理员权限");
    await router.replace({ name: "user" });
    checkingAdminAccess.value = false;
    return;
  }

  canAccessAdmin.value = true;
  checkingAdminAccess.value = false;
}

onMounted(async () => {
  window.addEventListener("resize", updateLayout);
  await checkAdminAccess();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateLayout);
});
</script>

<style scoped>
.mobile-admin-menu-button {
  z-index: 60;
}

.mobile-admin-menu-button :deep(.n-float-button__body) {
  color: rgb(75 85 99);
}

:global(.dark) .mobile-admin-menu-button :deep(.n-float-button__body) {
  color: rgb(209 213 219);
}
</style>
