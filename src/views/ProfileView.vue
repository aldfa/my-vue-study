<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/ProfileView.vue
 * 路由：/profile
 * ============================================================
 * 路由化之后，页面组件不再从 App.vue 接收 props，
 * 而是直接 import 全局 store。App.vue 那边改成 <RouterView />，
 * 没法往路由组件里塞 props，所以数据来源必须是模块级的。
 *
 * 这里对 store 做的修改会直接生效（比如编辑页改名后切回来立刻变），
 * 而且刷新后也还在 —— 因为 store 的写操作已经和 localStorage 同步过了。
 * ============================================================
 */
import ProfileSidebar from '../components/ProfileSidebar.vue'
import IntroSection from '../components/IntroSection.vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profileStore'

/**
 * 在 setup 里调用 useProfileStore() 拿到 store 实例。
 * 「在 setup 里调」是硬性要求：store 必须挂到当前 app 上才能创建，
 * 所以不能在模块顶层 import 时就调用。
 *
 * storeToRefs 拆出来的都是响应式 ref，
 * 模板里直接用 {{ student.name }}，不用再 store.student.name。
 */
const store = useProfileStore()
const { student, students, avatarUrl, intro, detailsExpanded, stats } = storeToRefs(store)

/**
 * 展开/收起简介。
 *
 * 之前模板里写的是 @toggle-details="store.detailsExpanded = !store.detailsExpanded"，
 * 直接在组件里改 state。这样有两个问题：
 *   1. 绕过了 action —— Pinia 官方只推荐 action 作为写入口；
 *   2. 【持久化会漏掉】这次修改，刷新后展开状态弹回原样。
 * 所以收回 store 里做成 toggleDetails()，action 内部负责改 + 存。
 */
function toggleDetails() {
  store.toggleDetails()
}
</script>

<template>
  <div class="view-container profile-grid">
    <ProfileSidebar
      :student="student"
      :students="students"
      :avatarUrl="avatarUrl"
      :counts="stats"
    />

    <IntroSection
      :intro="intro"
      :detailsExpanded="detailsExpanded"
      @toggle-details="toggleDetails"
    />
  </div>
</template>