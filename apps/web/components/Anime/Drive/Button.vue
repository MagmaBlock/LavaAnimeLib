<template>
  <NSpin :show="loading">
    <AnimeCardButton class="py-1.5 px-4" :active="active">
      <div>
        {{ name }}
      </div>
      <div class="text-xs opacity-80">
        {{ description }}
      </div>
    </AnimeCardButton>
  </NSpin>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
  name?: string
  description?: string
  disable?: boolean
  loading?: boolean
}>()
</script>
