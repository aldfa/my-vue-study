<script setup>
/**
 * ============================================================
 * 【筛选标签】src/components/ArticleFilterTabs.vue
 * ============================================================
 * 全部文章 / 已发布 / 草稿 三个筛选项，带数量角标。
 *
 * 【为什么这里用 button 而不是 <RouterLink>？】
 * 其它导航（左侧栏、列表里的「查看」「编辑」）都用了 RouterLink 的自动高亮，
 * 但那套高亮只认「同一条路由记录」，不比较 query。
 * 三个筛选项共用同一个 path、只差 ?status=，
 * 用 RouterLink 的话三个会同时被点亮 —— 所以这里老老实实用 button，
 * 自己在「当前筛选项」上绑 .active。
 *
 * 【状态为什么放在 URL 上？】
 * 点击筛选项会真正改变地址栏（?status=draft），好处是：
 *   - 刷新页面，当前筛选条件不丢
 *   - 这个「草稿列表」的链接可以直接分享出去
 * 这就是路由的 query 参数最典型的用途。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  /** { all: 3, published: 1, draft: 2 } —— 由父组件算好传进来 */
  counts: { type: Object, required: true },
})

const route = useRoute()
const router = useRouter()

const tabs = [
  { value: 'all', label: '全部文章' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
]

/**
 * 当前选中的筛选项。
 * 直接把 URL 里可能出现的脏值（?status=xxx）也兜住：
 * 不在 tabs 里的一律当「全部」，不会出现三个标签全灭的情况。
 */
const active = computed(() => {
  const q = route.query.status
  return tabs.some((t) => t.value === q) ? q : 'all'
})

function select(value) {
  // 已经是当前项就别再 push，否则会往历史栈里塞重复记录
  if (value === active.value) return
  router.push({
    path: '/articles',
    // 「全部」不带 query，让地址栏保持干净的 /articles
    query: value === 'all' ? {} : { status: value },
  })
}
</script>

<template>
  <nav class="filter-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="filter-tab"
      :class="{ active: active === tab.value }"
      @click="select(tab.value)"
    >
      {{ tab.label }}
      <span class="filter-count">{{ props.counts[tab.value] }}</span>
    </button>
  </nav>
</template>