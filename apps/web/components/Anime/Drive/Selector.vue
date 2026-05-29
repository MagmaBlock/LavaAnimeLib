<template>
  <AnimeCardFlod class="select-none" v-if="!store.state.driveData.isLoading && store.driveData">
    <template #title>
      <div>
        节点
        <span v-if="store.driveData.list.length" class="mx-1 text-xs opacity-75">
          {{ store.driveData.list.length }}个
        </span>
      </div>
    </template>
    <NScrollbar class="max-h-[25vh]">
      <div class="grid gap-1">
        <template v-for="drive in store.driveData.list" :key="drive.id">
          <div
            v-if="epCount(drive) === 1"
            class="cursor-pointer"
            @click="store.changeDrive(drive.id, drive.endpoints![0].id)"
          >
            <AnimeDriveButton
              :name="drive.name"
              :description="drive.endpoints![0].name"
              :disable="store.animeData?.type?.nsfw && drive.endpoints![0].banNSFW"
              :loading="store.state.driveLoading == drive.id"
              :active="store.activeDrive?.id == drive.id"
            />
          </div>
          <div v-else>
            <div
              class="flex items-center gap-2 cursor-pointer rounded-md py-1.5 px-4 select-none"
              :class="driveBarClass(drive)"
              @click="toggleExpand(drive)"
            >
              <div class="flex-1 min-w-0">
                <div class="truncate">{{ drive.name }}</div>
                <div class="text-xs opacity-80 truncate">{{ endpointLabel(drive) }}</div>
              </div>
              <Icon v-if="store.state.driveLoading == drive.id" name="mdi:loading" class="animate-spin" size="16" />
              <Icon
                v-else-if="epCount(drive) > 1"
                :name="expandedId === drive.id ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"
                size="16"
              />
            </div>
            <NCollapseTransition :show="expandedId === drive.id">
              <div v-if="epCount(drive) > 1" class="ml-4 mt-1">
                <NRadioGroup :value="activeEpId(drive)" @update:value="(v) => selectEp(drive.id, v)">
                  <div class="grid gap-1">
                    <div
                      v-for="ep in drive.endpoints"
                      :key="ep.id"
                      class="rounded-md px-3 py-1"
                      :class="epRadioBg(drive, ep)"
                    >
                      <NRadio
                        :value="ep.id"
                        :disabled="!!(store.animeData?.type?.nsfw && ep.banNSFW)"
                      >
                        <span class="text-sm">{{ ep.name }}</span>
                        <span class="text-xs opacity-60 ml-1">线路</span>
                      </NRadio>
                    </div>
                  </div>
                </NRadioGroup>
              </div>
            </NCollapseTransition>
          </div>
        </template>
      </div>
    </NScrollbar>
    <NCheckbox
      v-model:checked="store.myDrive.rememberMyChoice"
      class="mt-2 mx-1"
      size="small"
    >
      记住我的选择
    </NCheckbox>
    <template #close>
      <AnimeDriveButton
        v-if="store.activeDrive"
        :name="store.activeDrive.name"
        :description="store.activeEndpoint?.name"
        :disable="store.animeData?.type?.nsfw && !!store.activeEndpoint?.banNSFW"
        :loading="!!store.state.driveLoading"
      />
    </template>
  </AnimeCardFlod>
</template>

<script setup lang="ts">
import type { DriveInfo, EndpointInfo } from "@lavaanime/shared";
import { ref, watch } from "vue";
import { NRadioGroup, NRadio } from "naive-ui";

const store = useAnimeStore();
const expandedId = ref<string | null>(null);

watch(
  () => store.activeDrive?.id,
  (activeId) => {
    if (activeId) {
      const drive = store.driveData?.list.find((d) => d.id === activeId);
      if (drive && epCount(drive) > 1) {
        expandedId.value = activeId;
      }
    }
  },
  { immediate: true }
);

function epCount(d: DriveInfo): number {
  return d.endpoints?.length ?? 0;
}

function driveBarClass(d: DriveInfo): string[] {
  const c: string[] = [];
  if (store.activeDrive?.id === d.id) {
    c.push("bg-blue-600", "text-white");
  } else {
    c.push("bg-zinc-100", "dark:bg-zinc-800", "hover:bg-zinc-200", "dark:hover:bg-zinc-700");
  }
  if (epCount(d) === 0) {
    c.push("opacity-50", "brightness-75");
  }
  return c;
}

function activeEpId(d: DriveInfo): number | null {
  if (store.activeDrive?.id === d.id) {
    return store.selectedEndpointId ?? store.activeEndpoint?.id ?? null;
  }
  return null;
}

function epRadioBg(d: DriveInfo, ep: EndpointInfo): string {
  if (store.activeDrive?.id !== d.id) return "";
  const activeId = store.selectedEndpointId ?? store.activeEndpoint?.id;
  return activeId === ep.id
    ? "bg-blue-50 dark:bg-blue-900/20"
    : "bg-zinc-50 dark:bg-zinc-900";
}

function toggleExpand(d: DriveInfo) {
  if (epCount(d) <= 1) {
    store.changeDrive(d.id);
    return;
  }
  expandedId.value = expandedId.value === d.id ? null : d.id;
}

function selectEp(driveId: string, epId: number) {
  if (store.activeDrive?.id === driveId) {
    store.changeEndpoint(epId);
  } else {
    store.changeDrive(driveId, epId);
  }
}

function endpointLabel(d: DriveInfo): string {
  if (store.activeDrive?.id === d.id && store.activeEndpoint) {
    return store.activeEndpoint.name;
  }
  if (d.endpoints?.length) {
    const sel = store.myDrive.selectedEndpoints;
    if (sel && sel[d.id] != null) {
      const found = d.endpoints.find((ep) => ep.id === sel[d.id]);
      if (found) return found.name;
    }
    return d.endpoints[0].name;
  }
  return "无可用的线路";
}
</script>
