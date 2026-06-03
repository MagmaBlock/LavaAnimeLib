<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="text-sm text-gray-500 dark:text-gray-400">内容管理</div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">索引页活动管理</h1>
      </div>
      <NButton
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        <template #icon>
          <Icon icon="fluent:cloud-arrow-up-24-regular" width="16" height="16" />
        </template>
        提交更新
      </NButton>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-7 gap-4">
      <div class="lg:col-span-3">
        <NCard title="样式预览" :bordered="false" class="!rounded-xl">
          <template #header-extra>
            <NTag :type="store.activityCard.enable ? 'success' : 'default'" size="small" round>
              {{ store.activityCard.enable ? '已启用' : '已禁用' }}
            </NTag>
          </template>
          <div class="min-h-[120px] flex items-center justify-center">
            <div v-if="store.activityCard.enable" class="w-full">
              <a
                v-if="store.activityCard.link.enable"
                :href="store.activityCard.link.url"
                target="_blank"
                class="block"
              >
                <img
                  :src="store.activityCard.image"
                  class="w-full rounded-lg transition active:scale-95 hover:brightness-110"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </a>
              <img
                v-else
                :src="store.activityCard.image"
                class="w-full rounded-lg transition active:scale-95 hover:brightness-110"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <NEmpty v-else description="活动卡片已禁用，开启后此处将显示预览" size="small" />
          </div>
        </NCard>
      </div>

      <div class="lg:col-span-4">
        <NCard title="活动卡片配置" :bordered="false" class="!rounded-xl">
          <NForm label-placement="left" label-width="auto" :show-feedback="false">
            <NFormItem label="开启活动卡片">
              <NSwitch v-model:value="store.activityCard.enable" />
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {{ store.activityCard.enable ? '活动卡片将在首页显示' : '首页隐藏活动卡片' }}
              </span>
            </NFormItem>
            <NFormItem label="可点击链接">
              <NSwitch v-model:value="store.activityCard.link.enable" />
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                开启后点击图片将跳转至指定链接
              </span>
            </NFormItem>
            <NFormItem label="链接地址" v-if="store.activityCard.link.enable">
              <NInput
                v-model:value="store.activityCard.link.url"
                placeholder="https://example.com"
              />
            </NFormItem>
            <NFormItem label="海报图片">
              <NInput
                v-model:value="store.activityCard.image"
                placeholder="https://example.com/poster.jpg"
              />
            </NFormItem>
          </NForm>
        </NCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";

definePageMeta({
  layout: "admin",
});

useHead({ title: "索引页活动管理" });

const store = useIndex();
const message = useMessage();
const submitting = ref(false);

async function handleSubmit() {
  submitting.value = true;
  try {
    const request = await api.post("/v2/site/setting/set", {
      key: "indexActivityCard",
      value: store.activityCard,
    });
    if (request.data?.code == 200) {
      message.success("活动卡片更新成功");
    }
  } catch (_error) {
    message.error("提交失败");
  } finally {
    submitting.value = false;
  }
}
</script>
