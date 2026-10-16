<script setup>
import { computed } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  students: { type: Array, required: true },
})

const email = computed(() => props.students.find(s => s.label === '邮箱')?.value || '')
const phone = computed(() => props.students.find(s => s.label === '电话')?.value || '')
</script>

<template>
  <footer class="site-footer">
    <p class="footer-copyright">© {{ new Date().getFullYear() }} {{ student.name }} · 个人主页 · Powered by Vue 3 + Vite</p>

    <!-- ======== 默认插槽 ========
         父组件在 <AppFooter> 标签里写的内容，会替换掉下面这段「后备内容」。
         如果父组件什么都没写，就显示后备内容（邮箱 / 电话）。 -->
    <slot>
      <p class="footer-contact">
        <a v-if="email" :href="`mailto:${email}`">{{ email }}</a>
        <template v-if="email && phone"> · </template>
        <span v-if="phone">{{ phone }}</span>
      </p>
    </slot>
  </footer>
</template>

<style scoped></style>