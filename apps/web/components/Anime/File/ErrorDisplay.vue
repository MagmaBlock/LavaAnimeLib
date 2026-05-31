<template>
  <AnimeCardBasic class="py-4" v-if="store.state.fileData.errorCode">
    <NResult
      status="info"
      title="出现错误"
      :description="
        store.state.fileData.errorCode +
        '  ' +
        store.state.fileData.errorMessage
      "
    >
      <template #footer>
        <NButton @click="retry">重试</NButton>
      </template>
    </NResult>
  </AnimeCardBasic>
</template>

<script setup>
const store = useAnimeStore();

const retry = async () => {
  if (!store.preferredDrive) return;
  await store.getFileData(store.laID, store.preferredDrive.id, store.preferredEndpoint?.id);
  store.autoPlay();
};
</script>
