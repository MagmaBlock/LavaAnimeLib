<template>
  <NCollapseTransition>
    <div class="flex items-center gap-2 flex-nowrap">
      <NSwitch v-model:value="subtitleEnabled" />
      <Icon name="material-symbols:subtitles-outline" class="w-6 h-6" />
      <NSelect
        :placeholder="
          localSubtitle
            ? `本地字幕: ${getShortName(localSubtitle.name)}`
            : '未选择外挂字幕'
        "
        size="small"
        :options="subtitleSelectList"
        :value="activeSubtitleName"
        :dropdown-props="{ trigger: 'click', showArrow: true }"
        @update:value="handleSubtitleSelect"
        class="truncate"
      >
        <template #action>
          <div class="flex flex-col gap-2">
            <NPopover trigger="click">
              <template #trigger>
                <NButton size="small">
                  <template #icon>
                    <Icon name="material-symbols:help" class="w-5 h-5" />
                  </template>
                  这是什么
                </NButton>
              </template>
              <NAlert type="info">
                外挂字幕是一种将字幕和视频分离的技术，番剧库支持外挂字幕，您可以切换不同的字幕轨道，或者选择您设备上的字幕。<br />
                通常中文字幕以"zh"、"chi"来结尾。
              </NAlert>
            </NPopover>

            <NButton
              v-if="localSubtitle"
              size="small"
              type="error"
              @click="emit('clear-local-subtitle')"
            >
              <template #icon>
                <Icon name="material-symbols:delete-outline" class="w-5 h-5" />
              </template>
              清除本地字幕
            </NButton>

            <NButton
              v-if="!localSubtitle"
              size="small"
              type="primary"
              @click="handleUploadSubtitle"
            >
              <template #icon>
                <Icon name="material-symbols:upload" class="w-5 h-5" />
              </template>
              播放本地字幕
            </NButton>
          </div>
        </template>
      </NSelect>
    </div>
  </NCollapseTransition>
</template>

<script lang="ts" setup>
import type { FileData } from "~/composables/store/Anime";

const subtitleEnabled = defineModel<boolean>('subtitleEnabled', { default: true })

const props = defineProps<{
  localSubtitle?: { name: string; content: string; type: string } | null
  subtitleList: FileData
  activeSubtitleName?: string | null
}>()

const emit = defineEmits<{
  'select-subtitle': [fileName: string]
  'upload-local-subtitle': [file: File]
  'clear-local-subtitle': []
}>()

const message = useMessage();

function getShortName(name: string) {
  return name.length > 20 ? `...${name.slice(-18)}` : name;
}

const subtitleSelectList = computed(() => {
  return props.subtitleList.map((file) => {
    const displayName =
      file.name.length > 60 ? `...${file.name.slice(-30)}` : file.name;
    return {
      label: displayName,
      value: file.name,
    };
  });
});

function handleSubtitleSelect(value: string) {
  emit('clear-local-subtitle');
  emit('select-subtitle', value);
}

function handleUploadSubtitle() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".srt,.ass,.ssa,.vtt";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }

    try {
      emit('upload-local-subtitle', file);
      message.success(`字幕 "${file.name}" 上传成功`);
    } catch (error) {
      message.error(`字幕上传失败: ${error}`);
    } finally {
      document.body.removeChild(fileInput);
    }
  };

  fileInput.click();
}
</script>
