<script setup>
/**
 * ============================================================
 * 【404 页面】src/views/NotFoundView.vue
 * ============================================================
 * 它是被路由表最后那条 '/:pathMatch(.*)*' 匹配到的。
 * 结构上要和其他页面一致：外层 .view-container + 内部 .panel，
 * 这样切到 404 时左右栏、顶栏、底部都不会变形。
 *
 * useRouter() 拿到的 router 对象用来做编程式跳转。
 * 注意：函数式跳转用 push（会往 history 里加一条），
 *       而 <RouterLink> / replace 用于「不留历史记录」的跳转
 *       （404 页面返回首页时，用户不该能再退回来看到 404）。
 * ============================================================
 */
import { useRouter } from 'vue-router'

const router = useRouter()

/** 返回首页：用 replace 而不是 push，避免 404 留在历史栈里 */
function goHome() {
  router.replace('/profile')
}
</script>

<template>
  <div class="view-container">
    <div class="panel nf-panel">
      <p class="nf-code">404</p>
      <h2 class="nf-title">页面走丢了</h2>
      <p class="nf-desc">
        你访问的地址 <code class="nf-path">{{ $route.fullPath }}</code> 不存在，
        可能已被移动或删除。
      </p>

      <div class="nf-actions">
        <button class="btn btn-primary" @click="goHome">返回首页</button>
        <!-- go 传 -1 表示「后退一步」，回到跳转过来的那个页面 -->
        <button class="btn btn-secondary" @click="router.go(-1)">返回上一页</button>
      </div>
    </div>
  </div>
</template>