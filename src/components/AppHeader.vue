<script setup>
/**
 * ============================================================
 * 【导航栏】src/components/AppHeader.vue
 * ============================================================
 * 这里最重要的改动：<button @click="navigate"> 换成了 <RouterLink to="...">
 *
 * 区别在哪？
 *   button + emit：只是 App.vue 内部改了个变量，地址栏不变。
 *                    → 刷新一下就回到第一页，前进/后退键无效
 *   RouterLink    ：真正改变 URL，走的是浏览器 history 栈。
 *                    → 地址栏可分享、可收藏、可前进后退
 *
 * 高亮也不用自己写 active 判断了：
 *   <RouterLink> 会自动比对当前路由，命中就给 <a> 加上 active 类名，
 *   所以用 active-class="active" 复用原来 .nav-btn.active 的样式即可。
 *   （唯一例外见下面 isActiveSection 的说明。）
 *
 * 要点：RouterLink 是全局注册的组件，<script setup> 里不用 import。
 * ============================================================ */
import { useRoute } from 'vue-router'

defineProps({
  name: { type: String, default: '' },
  isDark: { type: Boolean, default: false },
  /**
   * 登录态由 App.vue 从 userStore 取好后传进来。
   *
   * 为什么导航栏不自己 import store？
   *   AppHeader 是纯粹的展示组件：数据靠 props 进、动作靠 emit 出。
   *   保持这条边界的好处是，它可以在任何项目里复用，不必依赖 Pinia。
   *   （profileStore / userStore 的调用集中在 App.vue 和各页面里。）
   */
  isLoggedIn: { type: Boolean, default: false },
  displayName: { type: String, default: '' },
})

const emits = defineEmits(['toggle-theme', 'sign-out'])

const route = useRoute()

/**
 * 导航项配置：path 必须和 router/index.js 里的 path 对得上
 *
 * auth 为 true 表示这个页面受登录态保护（见 router/index.js 的
 * AUTH_REQUIRED_PREFIXES）。这里只是【提示】，真正的拦截在路由守卫里 ——
 * 就算把锁图标去掉、直接敲 URL，守卫照样会拦。
 */
const navItems = [
  { path: '/profile', label: '个人信息', icon: '👤' },
  { path: '/skills', label: '技能标签', icon: '🏷️' },
  { path: '/projects', label: '项目经历', icon: '📁', auth: true },
  { path: '/hobbies', label: '兴趣爱好', icon: '✨' },
  { path: '/articles', label: '文章管理', icon: '📝', auth: true },
  { path: '/edit', label: '编辑资料', icon: '✏️', auth: true },
]

/**
 * RouterLink 的自动高亮只认「同一条路由记录」，不看路径前缀。
 * 所以进入 /articles/new、/articles/3/edit 这些文章管理的子页面时，
 * 「文章管理」这一项会自动熄灭。这里再补一个前缀判断：
 * 两个 class 名都叫 active，样式不会冲突，谁点亮都是同一个高亮。
 */
function isActiveSection(path) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header class="site-header" id="top">
    <div class="header-inner">
      <!-- 品牌：用 RouterLink 指回首页页 -->
      <RouterLink class="brand" to="/profile" title="回到首页">
        <span class="brand-logo">{{ (name || 'P').charAt(0).toUpperCase() }}</span>
        <span class="brand-text">
          <span class="brand-name">{{ name }}</span>
          <span class="brand-sub">学生个人档案</span>
        </span>
      </RouterLink>

      <!-- 导航：RouterLink 自动高亮当前页 -->
      <nav class="header-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-btn"
          active-class="active"
          :class="{ active: isActiveSection(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <!-- 未登录时给受保护项加个锁，暗示「这里要验证身份」 -->
          <span v-if="item.auth && !isLoggedIn" class="nav-lock" title="需要登录">🔒</span>
        </RouterLink>
      </nav>

      <!-- 底部：命名插槽 + 主题切换 + 登录态（都是全局 UI 状态 / 全局数据） -->
      <div class="header-footer">
        <slot name="nav-extra"></slot>

        <!-- 登录态入口：已登录显示用户名 + 退出，未登录显示「去登录」 -->
        <RouterLink
          v-if="isLoggedIn"
          class="user-chip"
          to="/login"
          title="已登录，点击可管理登录状态"
        >
          <span class="user-dot"></span>
          <span class="user-name">{{ displayName }}</span>
          <button class="user-signout" @click.prevent.stop="emits('sign-out')">退出</button>
        </RouterLink>

        <RouterLink v-else class="btn btn-secondary btn-sm" to="/login">登录</RouterLink>

        <button class="header-toggle" @click="emits('toggle-theme')"
          :title="isDark ? '切换到亮色主题' : '切换到暗色主题'">
          {{ isDark ? '☀️ 亮色模式' : '🌙 暗色模式' }}
        </button>
      </div>
    </div>
  </header>
</template>