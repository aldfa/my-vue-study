<script setup>
import { computed } from 'vue'

const props = defineProps({
  skills: { type: Array, required: true },
})

const keyword = defineModel('keyword', { type: String, default: '' })

const filteredSkills = computed(() => {
  if (!keyword.value.trim()) return props.skills
  const kw = keyword.value.trim().toLowerCase()
  return props.skills.filter(skill => skill.toLowerCase().includes(kw))
})

function clearSkillFilter() {
  keyword.value = ''
}
</script>

<template>
  <section class="panel skills-panel">
    <div class="panel-head">
      <h2 class="panel-title">技能标签</h2>
    </div>

    <div class="skill-search">
      <input type="text" v-model="keyword" placeholder="输入关键词筛选技能..." />
      <!-- 作用域插槽：把 keyword 与 clear 动作交给父组件 -->
      <slot :keyword="keyword" :clear="clearSkillFilter"></slot>
    </div>

    <p class="skill-meta">共 {{ filteredSkills.length }} 项</p>

    <div class="tags" v-if="filteredSkills.length > 0">
      <span class="tag" v-for="(skill, i) in filteredSkills" :key="i">{{ skill }}</span>
    </div>
    <p class="empty-hint" v-else>没有匹配的技能，试试其他关键词吧。</p>
  </section>
</template>
