<template>
  <AnimeCardBasic>
    <template #header>
      <div class="flex place-items-center" @click="openTab = !openTab">
        <slot name="title"></slot>
        <div class="flex-1"></div>
        <Transition class="cursor-pointer" name="fade" mode="out-in">
          <Icon
            name="material-symbols:keyboard-arrow-up"
            size="16"
            v-if="openTab"
          />
          <Icon name="material-symbols:keyboard-arrow-down" size="16" v-else />
        </Transition>
      </div>
    </template>
    <!-- 内容部分 -->
    <NCollapseTransition :show="openTab" v-if="openTab !== null">
      <slot></slot>
    </NCollapseTransition>
    <NCollapseTransition :show="!openTab" v-if="$slots.close">
      <slot name="close"></slot>
    </NCollapseTransition>
  </AnimeCardBasic>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  mobileShow?: boolean
  desktopShow?: boolean
}>(), {
  mobileShow: false,
  desktopShow: true,
})

const openTab = ref<boolean | null>(null)

onMounted(() => {
  if (document.body.clientWidth < 1024) {
    openTab.value = props.mobileShow!
  } else {
    openTab.value = props.desktopShow!
  }
})
</script>
