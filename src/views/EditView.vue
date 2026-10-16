<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/EditView.vue
 * 路由：/edit
 * ============================================================
 * 这个页面演示两件事：
 *
 * 1. 写入 Pinia store —— 保存时调 store.updateProfile()，不经过 App.vue
 * 2. 编程式跳转 —— 保存成功后用 router.replace('/profile') 回档案页
 *    用 replace 是因为「保存」不应该在历史栈里留下一条记录，
 *    用户按浏览器后退键时不该又回到编辑页。
 * ============================================================
 */
import { useRouter } from 'vue-router'
import EditSection from '../components/EditSection.vue'
import { useProfileStore } from '../stores/profileStore'

const router = useRouter()
const store = useProfileStore()

/** 把表单提交的 payload 写回 Pinia store（字段增删只改 store 里这一个 action） */
function saveEdit(payload) {
  store.updateProfile(payload)

  // 回档案页看结果
  router.replace('/profile')
}

/** 取消：回到档案页，同样不留历史记录 */
function cancelEdit() {
  router.replace('/profile')
}
</script>

<template>
  <div class="view-container">
    <EditSection
      :student="store.student"
      :intro="store.intro"
      :skills="store.skills"
      @save-edit="saveEdit"
      @cancel-edit="cancelEdit"
    />
  </div>
</template>