<template>
  <div class="flex max-w-[2560px] mx-auto">
    <NavBar class="fixed h-screen z-50" />
    <div class="pb-36 lg:pb-0 lg:pl-[84px] w-full h-screen">
      <NLayout has-sider class="h-full">
        <NLayoutSider
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
        <NLayoutContent>
          <NScrollbar>
            <div class="p-4 md:p-6 lg:p-8">
              <NuxtPage />
            </div>
          </NScrollbar>
        </NLayoutContent>
      </NLayout>
    </div>

    <BackgroundProvider />
  </div>
</template>

<script lang="ts" setup></script>
