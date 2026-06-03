<template>
  <div>
    <NFlex vertical>
      <NCard embedded size="small" class="sticky top-0 z-10">
        <NFlex>
          <NButton
            secondary
            @click="copySelectedLinks"
            :disabled="!hasSelectedFiles"
            :loading="isResolving"
          >
            复制选中链接
          </NButton>
          <NButton
            secondary
            @click="copySelectedFileNamesAndLinks"
            :disabled="!hasSelectedFiles"
            :loading="isResolving"
          >
            复制选中文件名 + 链接
          </NButton>
        </NFlex>
      </NCard>
      <div v-if="fileList?.length">
        <NEmpty
          v-if="!allowDownload"
          class="my-8"
          description="当前节点因带宽有限不开放批量下载，请使用其他节点"
        />

        <div v-show="allowDownload">
          <div
            v-for="file in fileList"
            :key="file.name"
            class="mb-2"
          >
            <AnimeFileInfo
              :video="file"
              :active="!!selectedFiles[file.name]"
              @click="toggleSelect(file.name)"
            />
          </div>
        </div>
      </div>

      <NFlex vertical>
        <NSkeleton
          v-if="isLoading"
          v-for="a in 10"
          height="32px"
          :sharp="false"
        />
      </NFlex>
    </NFlex>
  </div>
</template>

<script lang="ts" setup>
import type { FileData } from "~/composables/anime";

const props = defineProps<{
  fileList: FileData
  isLoading: boolean
  allowDownload: boolean
  resolveFileUrl: (index: number) => Promise<string>
}>()

const selectedFiles = ref<Record<string, boolean>>({});
const isResolving = ref(false);

const hasSelectedFiles = computed(() => {
  return Object.values(selectedFiles.value).some(Boolean);
});

const toggleSelect = (name: string) => {
  if (selectedFiles.value[name]) {
    delete selectedFiles.value[name];
  } else {
    selectedFiles.value[name] = true;
  }
};

const resolveSelectedUrls = async () => {
  const results: { name: string; url: string }[] = [];
  for (let i = 0; i < props.fileList.length; i++) {
    const file = props.fileList[i];
    if (selectedFiles.value[file.name]) {
      try {
        const url = await props.resolveFileUrl(i);
        results.push({ name: file.name, url });
      } catch {
        window.$message?.error(`获取 ${file.name} 链接失败`);
      }
    }
  }
  return results;
};

const copySelectedLinks = async () => {
  isResolving.value = true;
  try {
    const results = await resolveSelectedUrls();
    if (!results.length) return;
    navigator.clipboard.writeText(results.map((r) => r.url).join("\n"));
    window.$message?.success(`已复制 ${results.length} 个链接`);
  } finally {
    isResolving.value = false;
  }
};

const copySelectedFileNamesAndLinks = async () => {
  isResolving.value = true;
  try {
    const results = await resolveSelectedUrls();
    if (!results.length) return;
    navigator.clipboard.writeText(results.map((r) => `${r.name} ${r.url}`).join("\n"));
    window.$message?.success(`已复制 ${results.length} 个链接`);
  } finally {
    isResolving.value = false;
  }
};
</script>

<style></style>
