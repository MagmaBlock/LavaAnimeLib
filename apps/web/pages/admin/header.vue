<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">主页头图管理</h1>
      </div>
      <NSpace size="small">
        <NButton @click="add" type="primary" secondary>
          <template #icon>
            <Icon icon="fluent:add-24-regular" width="16" height="16" />
          </template>
          添加头图
        </NButton>
        <NButton @click="submitData" type="primary" :loading="submitting">
          <template #icon>
            <Icon icon="fluent:cloud-arrow-up-24-regular" width="16" height="16" />
          </template>
          提交更新
        </NButton>
      </NSpace>
    </div>

    <div class="mb-6">
      <NCard title="预览" :bordered="false" size="small" class="!rounded-xl">
        <div class="h-44 sm:h-52 lg:h-64">
          <HomeHeaderPicture
            class="sm:rounded-md"
            :customdata="headers"
            :key="refresh"
          />
        </div>
      </NCard>
    </div>

    <NSpin :show="loading">
      <NEmpty v-if="!loading && headers.length === 0" description="暂无头图数据，点击上方按钮添加" />

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NCard
          v-for="(header, index) in headers"
          :key="index"
          :title="`头图 #${index + 1}`"
          :bordered="false"
          size="small"
          class="!rounded-xl"
        >
          <template #header-extra>
            <NSpace size="small">
              <NButton size="tiny" @click="move(index, -1)" :disabled="index === 0">
                <template #icon>
                  <Icon icon="fluent:arrow-up-24-regular" width="14" height="14" />
                </template>
              </NButton>
              <NButton size="tiny" @click="move(index, 1)" :disabled="index === headers.length - 1">
                <template #icon>
                  <Icon icon="fluent:arrow-down-24-regular" width="14" height="14" />
                </template>
              </NButton>
              <NPopconfirm @positive-click="remove(index)">
                <template #trigger>
                  <NButton size="tiny" type="error" secondary>
                    <template #icon>
                      <Icon icon="fluent:delete-24-regular" width="14" height="14" />
                    </template>
                  </NButton>
                </template>
                确定删除该头图？
              </NPopconfirm>
            </NSpace>
          </template>

          <img
            v-if="header.pic"
            :src="header.pic"
            class="w-full h-28 object-cover rounded-lg mb-3 bg-gray-100 dark:bg-zinc-800"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />

          <div class="space-y-2">
            <NInputGroup>
              <NInputGroupLabel>标题</NInputGroupLabel>
              <NInput v-model:value="header.title" placeholder="标题" />
            </NInputGroup>
            <NInputGroup>
              <NInputGroupLabel>副标题</NInputGroupLabel>
              <NInput v-model:value="header.subtitle" placeholder="副标题" />
            </NInputGroup>
            <NInputGroup>
              <NInputGroupLabel>图片链接</NInputGroupLabel>
              <NInput v-model:value="header.pic" placeholder="图片链接" />
            </NInputGroup>
            <NInputGroup>
              <NInputGroupLabel>{{ header.externalUrl ? "外部链接" : "链接" }}</NInputGroupLabel>
              <NInput
                v-model:value="header.url"
                :placeholder="header.externalUrl ? '外部链接' : '链接'"
              />
            </NInputGroup>

            <div class="flex items-center gap-4 pt-1">
              <div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <NSwitch v-model:value="header.externalUrl" size="small" />
                外部链接
              </div>
              <div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <NSwitch v-model:value="header.video" size="small" />
                为视频
              </div>
            </div>
          </div>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";

definePageMeta({
  layout: "admin",
});

useHead({ title: "主页头图管理" });

const message = useMessage();

const headers = ref<any[]>([]);
const refresh = ref(0);
const loading = ref(true);
const submitting = ref(false);

interface HeaderItem {
  title: string;
  subtitle: string;
  pic: string;
  url: string;
  externalUrl?: boolean;
  video?: boolean;
}

async function submitData() {
  submitting.value = true;
  try {
    const result = await api.post("/v2/home/header/update", {
      data: headers.value,
    });
    message.success(result.data.message);
    headers.value = (await api.get("/v2/home/header/get")).data.data ?? [];
  } catch (_error) {
    message.error("提交更新失败");
  } finally {
    submitting.value = false;
  }
}

function move(index: number, go: number) {
  if (go !== 1 && go !== -1) return;
  if (index + go >= headers.value.length || index + go < 0) return;
  const [item] = headers.value.splice(index, 1);
  headers.value.splice(index + go, 0, item);
  refresh.value++;
}

function remove(index: number) {
  headers.value.splice(index, 1);
  refresh.value++;
  message.success("已删除");
}

function add() {
  headers.value.push({
    title: "标题",
    subtitle: "副标题",
    pic: "/Home/headerPic/LavaAnime.jpg",
    url: "",
  });
  refresh.value++;
}

onMounted(async () => {
  loading.value = true;
  try { headers.value = (await api.get("/v2/home/header/get")).data.data ?? []; } catch { headers.value = []; }
  loading.value = false;
});
</script>
