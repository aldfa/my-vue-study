<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/ArticleDetailView.vue
 * 路由：/articles/:id
 * ============================================================
 * 已发布文章的阅读页（草稿不给看，只提示去编辑）。
 *
 * 两个细节值得留意：
 *
 * 1. 为什么用 watch(article, ...) 加 immediate 而不是 onMounted？
 *    因为从 /articles/1 切到 /articles/2 时组件实例会被复用，
 *    onMounted 只在第一次挂载时跑一次，阅读量就只加了第一篇。
 *    watch 监听的是 computed 出来的「当前文章」，切一篇就触发一次。
 *    （immediate: true 让首次进入也能加上那一次。）
 *
 * 2. 正文为什么用 {{ }} 而不是 v-html？
 *    文章内容是用户输入的，v-html 会把它当 HTML 执行，存在 XSS 风险。
 *    这里按空行拆段，用 <p> 渲染，纯文本展示，天然安全。
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore, STATUS_TEXT } from '../stores/articleStore'

const route = useRoute()
const router = useRouter()
const store = useArticleStore()

const article = computed(() => store.getById(route.params.id))

const notFound = computed(() => !article.value)
const isDraft = computed(() => Boolean(article.value) && article.value.status === 'draft')

/** 打开一篇已发布文章 → 阅读量 +1 */
watch(
  article,
  (current) => {
    if (current) store.recordView(current.id)
  },
  { immediate: true },
)

/** 正文按换行拆段（编辑时是「空一行即分段」） */
const paragraphs = computed(() =>
  (article.value?.content || '').split('\n').filter((line) => line.trim()),
)

/** 返回列表。用 replace，不在历史栈里留一条「文章详情」 */
function backToList() {
  router.replace('/articles')
}
</script>

<template>
  <div class="view-container">
    <!-- 查无此文 -->
    <div class="panel article-notice" v-if="notFound">
      <p class="article-notice-title">文章不存在</p>
      <p class="article-notice-desc">
        找不到 ID 为 <code class="nf-path">{{ route.params.id }}</code> 的文章，它可能已被删除。
      </p>
      <div class="notice-actions">
        <RouterLink class="btn btn-primary" to="/articles">返回文章列表</RouterLink>
      </div>
    </div>

    <!-- 是草稿：不让公开查看，提示去编辑 -->
    <div class="panel article-notice" v-else-if="isDraft">
      <p class="article-notice-title">这篇文章还是草稿</p>
      <p class="article-notice-desc">
        《{{ article.title }}》尚未发布，所以只有你能在这里预览。
      </p>
      <div class="notice-actions">
        <RouterLink class="btn btn-primary" :to="`/articles/${article.id}/edit`">去编辑</RouterLink>
        <button class="btn btn-secondary" @click="backToList">返回文章列表</button>
      </div>
    </div>

    <!-- 正常阅读 -->
    <template v-else>
      <section class="panel article-detail">
        <div class="panel-head">
          <h2 class="panel-title">文章详情</h2>
          <span class="badge badge-published">{{ STATUS_TEXT[article.status] }}</span>
        </div>

        <h1 class="article-detail-title">{{ article.title }}</h1>

        <p class="article-meta">
          <span>发布于 {{ article.publishedAt || '—' }}</span>
          <span>·</span>
          <span>更新于 {{ article.updatedAt }}</span>
          <span>·</span>
          <span>阅读 {{ article.views }}</span>
        </p>

        <div class="article-body">
          <p v-for="(line, i) in paragraphs" :key="i">{{ line }}</p>
        </div>

        <div class="article-tags" v-if="article.tags.length">
          <span class="article-tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="edit-actions">
          <RouterLink class="btn btn-secondary" :to="`/articles/${article.id}/edit`">编辑</RouterLink>
          <button class="btn btn-primary" @click="backToList">返回文章列表</button>
        </div>
      </section>
    </template>
  </div>
</template>