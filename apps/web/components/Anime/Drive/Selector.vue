<template>
  <AnimeCardFlod class="select-none" :desktop-show="false" v-if="!store.state.driveData.isLoading && store.driveData">
    <template #title>
      <div>
        播放来源
        <span v-if="store.driveData.list.length" class="mx-1 text-xs opacity-75">
          {{ availabilityText }}
        </span>
      </div>
    </template>

    <!-- 展开态：驱动列表 + 线路选择 -->
    <div class="grid gap-1">
      <template v-for="drive in store.driveData.list" :key="drive.id">
        <div
          v-if="epCount(drive) === 1"
          class="cursor-pointer"
          @click="selectDrive(drive.id, drive.endpoints![0].id)"
        >
          <AnimeDriveButton
            :name="drive.name"
            :description="drive.endpoints![0].name"
            :disable="store.animeData?.type?.nsfw && drive.endpoints![0].banNSFW"
            :active="store.preferredDrive?.id == drive.id"
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
            <Icon
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

    <div v-if="store.isFallback" class="mt-2 text-xs opacity-50 pl-1">
      ↳ 当前文件由 {{ store.actualDriveName }} · {{ store.actualEndpointName }} 提供
    </div>

    <NCheckbox
      v-model:checked="store.myDrive.rememberMyChoice"
      class="mt-2 mx-1"
      size="small"
    >
      记住我的选择
    </NCheckbox>

    <!-- 收起态：紧凑的首选驱动信息 -->
    <template #close>
      <div v-if="store.preferredDrive" class="py-0.5">
        <div class="flex items-center gap-2 rounded-md py-1 px-3 select-none bg-blue-600 text-white">
          <div class="min-w-0">
            <div class="text-sm truncate font-medium">{{ store.preferredDrive.name }}</div>
            <div class="text-xs opacity-80 truncate">{{ store.preferredEndpoint?.name ?? "" }}</div>
          </div>
        </div>
        <div v-if="store.isFallback" class="mt-1 text-xs opacity-50 pl-1">
          ↳ 当前文件由 {{ store.actualDriveName }} · {{ store.actualEndpointName }} 提供
        </div>
      </div>
      <div v-else class="text-xs opacity-50 px-3 py-1">
        暂无可用节点
      </div>
    </template>
  </AnimeCardFlod>
</template>

<script setup lang="ts">
import type { DriveInfo, EndpointInfo } from "@lavaanime/shared";
import { ref, watch, computed } from "vue";
import { NRadioGroup, NRadio } from "naive-ui";

const store = useAnimeStore();
const expandedId = ref<string | null>(null);

const availabilityText = computed(() => {
  const activeFile = store.activeFile;
  let driveCount: number;
  let endpointCount: number;

  if (activeFile?.drives?.length) {
    driveCount = activeFile.drives.length;
    endpointCount = 0;
    for (const d of activeFile.drives) {
      const driveInfo = store.driveData?.list.find((di) => di.id === d.driveId);
      endpointCount += driveInfo?.endpoints?.length ?? 0;
    }
  } else {
    driveCount = store.driveData?.list?.length ?? 0;
    endpointCount = 0;
    store.driveData?.list?.forEach((d) => {
      endpointCount += d.endpoints?.length ?? 0;
    });
  }

  return `共${driveCount}个存储节点、${endpointCount}个线路可用`;
});

watch(
  () => store.preferredDrive?.id,
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
  if (store.preferredDrive?.id === d.id) {
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
  if (store.preferredDrive?.id === d.id) {
    return store.preferredEndpointId ?? store.preferredEndpoint?.id ?? null;
  }
  return null;
}

function epRadioBg(d: DriveInfo, ep: EndpointInfo): string {
  if (store.preferredDrive?.id !== d.id) return "";
  const activeId = store.preferredEndpointId ?? store.preferredEndpoint?.id;
  return activeId === ep.id
    ? "bg-blue-50 dark:bg-blue-900/20"
    : "bg-zinc-50 dark:bg-zinc-900";
}

function toggleExpand(d: DriveInfo) {
  if (epCount(d) <= 1) {
    selectDrive(d.id);
    return;
  }
  expandedId.value = expandedId.value === d.id ? null : d.id;
}

function selectDrive(driveId: string, epId?: number) {
  store.setPreferredDrive(driveId, epId);
}

function selectEp(driveId: string, epId: number) {
  if (store.preferredDrive?.id === driveId) {
    store.setPreferredEndpoint(epId);
  } else {
    store.setPreferredDrive(driveId, epId);
  }
}

function endpointLabel(d: DriveInfo): string {
  if (store.preferredDrive?.id === d.id && store.preferredEndpoint) {
    return store.preferredEndpoint.name;
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
