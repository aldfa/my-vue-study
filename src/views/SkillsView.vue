<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/SkillsView.vue
 * 路由：/skills
 * ============================================================
 * 这一页演示 v-model 的跨组件用法（组件通信的重点）：
 *
 *   SkillsView              SkillsSection
 *   ─────────               ─────────────
 *   keyword ──prop──────▶  input 框
 *          ◀──update:keyword  用户输入
 *
 * defineModel('keyword') 是 Vue 3.4+ 的语法糖，
 * 等价于同时声明 props: { keyword } 和 emits: ['update:keyword']。
 * 好处：不用手写两边，父组件用 v-model:keyword 一行搞定。
 *
 * 注意：筛选是纯页面内的 UI 状态，切走再切回来会重置，
 * 这是符合预期的；需要保留才放到 store 里。
 * （技能【列表本身】是共享数据，所以它在 profileStore 里持久化了。）
 * ============================================================
 */
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import SkillsSection from '../components/SkillsSection.vue'
import { useProfileStore } from '../stores/profileStore'

/** setup 里取 store 实例 */
const store = useProfileStore()

/**
 * storeToRefs 把 store 的 state 拆成保持响应性的 ref，
 * 模板里可以直接写 skills，不用再 store.skills。
 * 注意 keyword 是纯页面状态（切页会重置），所以它留在组件本地。
 */
const { skills } = storeToRefs(store)

/** 筛选关键字 */
const keyword = ref('')
</script>

<template>
  <div class="view-container">
    <!-- v-model:keyword 双向绑定；默认插槽用作用域插槽写法拿 keyword/clear -->
    <SkillsSection v-model:keyword="keyword" :skills="skills">
      <template #default="{ keyword: kw, clear }">
        <button class="clear-btn" @click="clear" v-show="kw">清空</button>
      </template>
    </SkillsSection>
  </div>
</template>