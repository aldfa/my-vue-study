<script setup>
defineProps({
  student: { type: Object, required: true },
  students: { type: Array, required: true },
  avatarUrl: { type: String, default: '' },
  counts: { type: Object, default: () => ({ skills: 0, projects: 0, hobbies: 0 }) },
})
</script>

<template>
  <aside class="panel identity-card">
    <div class="identity-head">
      <img class="avatar" :src="avatarUrl" alt="头像" />
      <div class="identity-meta">
        <p class="name">{{ student.name }}</p>
        <p class="major">{{ student.major }}</p>
      </div>
    </div>

    <ul class="identity-info">
      <li v-for="(item, i) in students" :key="i">
        <span class="label">{{ item.label }}</span>
        <span class="value">{{ item.value }}</span>
      </li>
    </ul>

    <div class="identity-stats">
      <div class="stat-box">
        <span class="stat-num">{{ counts.skills }}</span>
        <span class="stat-label">项技能</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">{{ counts.projects }}</span>
        <span class="stat-label">个项目</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">{{ counts.hobbies }}</span>
        <span class="stat-label">个爱好</span>
      </div>
    </div>
  </aside>
</template>
