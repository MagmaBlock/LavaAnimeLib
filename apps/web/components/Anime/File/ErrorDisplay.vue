<template>
  <AnimeCardBasic class="py-4" v-if="errorCode">
    <NResult
      status="info"
      title="出现错误"
      :description="
        errorCode + '  ' + errorMessage
      "
    >
      <template #footer>
        <NButton @click="emit('retry')">重试</NButton>
      </template>
    </NResult>
  </AnimeCardBasic>
</template>

<script setup lang="ts">
defineProps<{
  errorCode?: number | null
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>
