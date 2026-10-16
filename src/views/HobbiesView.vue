<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/HobbiesView.vue
 * 路由：/hobbies
 * ============================================================
 * 最简单的只读页面：不需要 props，直接从全局 store 读。
 *
 * store 里的 hobbies 是 '🏀 篮球' 这样的字符串，
 * HobbiesSection 内部用 codePointAt 把它拆成图标和文字。
 * ============================================================
 */
import HobbiesSection from '../components/HobbiesSection.vue'
import { useProfileStore } from '../stores/profileStore'

/** setup 里取 store 实例 */
const store = useProfileStore()
</script>

<template>
  <div class="view-container">
    <HobbiesSection :hobbies="store.hobbies" />
  </div>
</template>