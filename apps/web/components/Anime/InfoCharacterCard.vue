<template>
  <div class="flex min-w-0 gap-3 rounded-md bg-white/70 p-3 ring-1 ring-gray-100 transition-colors hover:bg-white dark:bg-zinc-950/40 dark:ring-zinc-800 dark:hover:bg-zinc-900">
    <NuxtLink
      :to="`/bangumi-wiki/character/${char.id}`"
      class="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-zinc-700"
    >
      <img
        v-if="char.images?.grid"
        :src="char.images.grid"
        :alt="char.name"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
        <Icon name="material-symbols:person" />
      </div>
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-2">
        <NuxtLink
          :to="`/bangumi-wiki/character/${char.id}`"
          class="truncate text-sm font-semibold text-gray-800 transition-colors hover:text-blue-500 dark:text-zinc-100 dark:hover:text-blue-400"
        >
          {{ displayName }}
        </NuxtLink>
        <NTag v-if="char.relation" size="tiny" :bordered="false" class="shrink-0">
          {{ char.relation }}
        </NTag>
      </div>

      <div v-if="secondaryName" class="mt-0.5 truncate text-xs text-gray-400 dark:text-zinc-500">
        {{ secondaryName }}
      </div>

      <div v-if="visibleActors.length" class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        <NuxtLink
          v-for="actor in visibleActors"
          :key="actor.id"
          :to="`/bangumi-wiki/person/${actor.id}`"
          class="inline-flex min-w-0 items-center gap-1 text-xs text-gray-500 transition-colors hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400"
        >
          <Icon name="material-symbols:mic-outline-rounded" size="13" class="shrink-0" />
          <span class="truncate">{{ actor.name }}</span>
        </NuxtLink>
        <span v-if="moreActors" class="text-xs text-gray-400 dark:text-zinc-500">+{{ moreActors }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StructuredCharacter } from "@lavaanime/shared";

const props = withDefaults(defineProps<{
  char: StructuredCharacter
  compactActors?: boolean
}>(), {
  compactActors: false,
});

const actorLimit = computed(() => props.compactActors ? 2 : 8);
const visibleActors = computed(() => props.char.actors?.slice(0, actorLimit.value) ?? []);
const moreActors = computed(() => Math.max((props.char.actors?.length ?? 0) - visibleActors.value.length, 0));
const displayName = computed(() => props.char.name_cn?.trim() || props.char.name);
const secondaryName = computed(() => {
  const originalName = props.char.name?.trim();
  const cnName = props.char.name_cn?.trim();
  if (cnName && originalName && cnName !== originalName) return originalName;
  return "";
});
</script>
