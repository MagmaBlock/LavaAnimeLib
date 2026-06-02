<template>
  <div v-if="count" class="flex place-items-center gap-1">
    <Icon icon="material-symbols:stack" />
    <div>共 {{ count }} {{ episodeName ?? "话" }}</div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  count?: number
  episodeName?: string
}>()
</script>

<style></style>
