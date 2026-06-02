<template>
  <div v-if="props.notice">
    <AnimeCardBasic>
      <div class="flex space-x-3 items-center">
        <div class="text-xs">{{ props.notice }}</div>
      </div>
    </AnimeCardBasic>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  notice?: string | null
}>()
</script>

<style></style>
