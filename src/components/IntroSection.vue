<script setup>
defineProps({
  intro: { type: String, default: '' },
  detailsExpanded: { type: Boolean, default: true },
})

const emits = defineEmits(['toggle-details'])
</script>

<template>
  <section class="panel intro-panel">
    <div class="panel-head">
      <h2 class="panel-title">个人简介</h2>
      <button class="btn-link" @click="emits('toggle-details')">
        {{ detailsExpanded ? '收起 ▲' : '展开 ▼' }}
      </button>
    </div>
    <div class="details-collapse" :class="{ collapsed: !detailsExpanded }">
      <p class="intro-text">{{ intro }}</p>
    </div>
  </section>
</template>
