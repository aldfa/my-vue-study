<script setup>
import { computed } from 'vue'

const props = defineProps({
  hobbies: { type: Array, required: true },
})

// 把字符串拆成 emoji 图标与名称（如 "🏀 篮球"）
const hobbyItems = computed(() =>
  props.hobbies.map(h => {
    const first = h.codePointAt(0)
    const iconLen = first > 0xffff ? 2 : 1
    return { icon: h.slice(0, iconLen), name: h.slice(iconLen).trim() }
  })
)
</script>

<template>
  <section class="panel hobbies-panel">
    <div class="panel-head">
      <h2 class="panel-title">兴趣爱好</h2>
      <span class="skill-meta" style="margin:0">共 {{ hobbies.length }} 项</span>
    </div>

    <div class="hobby-grid">
      <div class="hobby-card" v-for="(item, i) in hobbyItems" :key="i">
        <span class="hobby-emoji">{{ item.icon }}</span>
        <span class="hobby-name">{{ item.name }}</span>
      </div>
    </div>
  </section>
</template>
