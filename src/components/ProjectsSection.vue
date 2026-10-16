<script setup>
/**
 * ============================================================
 * 【展示组件】src/components/ProjectsSection.vue
 * ============================================================
 * 只负责「把项目列表画出来」，自己一个字节的数据都不存。
 *
 * 【职责边界】
 * 数据从 props 来，操作一律 emit 给父组件 ——
 * 和 ArticleCard / ArticleFormSection 是同一条原则：
 * 视图组件只表达意图，store 的调用集中在页面组件里。
 * 这样将来把 profileStore 换成接口请求，改动不会波及这个组件。
 *
 * 两个 emit：
 *   edit(project)  —— 告诉父组件「我要改这一条」，回填表单是父组件的事
 *   remove(id)     —— 只传 id，组件不持有对象引用，避免拿着过期数据
 * ============================================================ */
defineProps({
  projects: { type: Array, required: true },
})

const emits = defineEmits(['edit', 'remove'])
</script>

<template>
  <section class="panel projects-panel">
    <div class="panel-head">
      <h2 class="panel-title">项目经历</h2>
      <div class="panel-head-extra">
        <span class="skill-meta" style="margin:0">共 {{ projects.length }} 个</span>
        <!--
          命名插槽：标题栏右侧的操作按钮由父组件传进来。
          和 ArticlesView 把「＋ 新建文章」放进自己 panel-head 是同一个思路 ——
          按钮长什么样、点了做什么，属于父组件的事，列表组件不关心。
        -->
        <slot name="head-extra"></slot>
      </div>
    </div>

    <div class="project-list" v-if="projects.length > 0">
      <!-- :key 必须用 proj.id，不能再用下标 i：
           有了增删改之后，下标会随增删整体错位，
           Vue 会把它当成「同一个组件只是数据变了」，
           实际渲染的却是另一个项目，状态和过渡动画全乱。 -->
      <article class="project-card" v-for="proj in projects" :key="proj.id">
        <div class="project-card-head">
          <h3 class="project-name">{{ proj.name }}</h3>
          <span class="badge">{{ proj.time }}</span>
        </div>
        <p class="project-desc">{{ proj.desc }}</p>

        <div class="article-actions">
          <button class="btn btn-secondary btn-sm" @click="emits('edit', proj)">编辑</button>
          <button class="btn btn-danger btn-sm" @click="emits('remove', proj.id)">删除</button>
        </div>
      </article>
    </div>

    <div v-else class="article-notice">
      <p class="article-notice-title">还没有项目记录</p>
      <p class="article-notice-desc">点右上角「＋ 新建项目」添加第一个项目。</p>
    </div>
  </section>
</template>