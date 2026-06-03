<template>
  <ContainerPageMobileFull>
    <div class="grid grid-cols-1 gap-2 sm:gap-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 sm:gap-4">
        <UserInfoCard />
        <UserFunctionsCard />
      </div>
      <div class="grid grid-cols-1 gap-2 sm:gap-4">
        <UserHistory />
        <UserFollow />
        <VideoTogetherMenu />
        <NCard
          title="管理员后台"
          :bordered="false"
          embedded
          v-if="userStore.userInfo?.data?.permission?.admin"
        >
          <NSpace>
            <RouterLink :to="{ name: 'admin' }">
              <NButton strong secondary>仪表盘</NButton>
            </RouterLink>
            <RouterLink :to="{ name: 'admin-header' }">
              <NButton strong secondary>主页头图</NButton>
            </RouterLink>
            <RouterLink :to="{ name: 'admin-invite' }">
              <NButton strong secondary>邀请码管理</NButton>
            </RouterLink>
            <RouterLink :to="{ name: 'admin-index-activity' }">
              <NButton strong secondary>索引页活动</NButton>
            </RouterLink>
          </NSpace>
        </NCard>
      </div>
    </div>
  </ContainerPageMobileFull>
</template>

<script setup>
useHead({ title: "我的" });
const userStore = useUser();
</script>
