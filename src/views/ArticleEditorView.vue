<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/ArticleEditorView.vue
 * 路由：/articles/new       → 新建
 *       /articles/:id/edit  → 编辑
 * ============================================================
 * 新建和编辑共用一个组件，靠「有没有 id 参数」区分模式：
 *   route.params.id 为 undefined → 新建（article = null）
 *   route.params.id 有值        → 编辑（从 store 里捞出那篇文章）
 *
 * 【:key 是必须的】
 * 从 /articles/1/edit 点进 /articles/2/edit 时，路由变了但组件是同一个，
 * Vue 不会重新执行 setup，表单会还停留在第 1 篇的内容上。
 * :key 一变，旧实例被销毁、新实例重新挂载，重新执行 setup 才拿得到新数据。
 *
 * 【为什么保存后用 router.replace 而不是 push？】
 * 和 EditView 一样的考虑：「保存」是完成动作，不应该在历史栈里留一条记录，
 * 否则用户按浏览器后退键会退回到刚才那个编辑页，还要再点一次保存。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArticleFormSection from '../components/ArticleFormSection.vue'
import { useArticleStore } from '../stores/articleStore'

const route = useRoute()
const router = useRouter()
const store = useArticleStore()

/** undefined 表示新建模式 */
const id = computed(() => route.params.id)

/** 编辑模式下要操作的那篇文章 */
const article = computed(() => (id.value ? store.getById(id.value) : null))

/** 带了 id 却查不到 —— 比如手输了一个不存在的地址 */
const notFound = computed(() => Boolean(id.value) && !article.value)

/** 交给子组件的 key，见文件头说明 */
const formKey = computed(() => id.value ?? 'new')

/**
 * 接收表单 emit 出来的 { payload, publish }。
 * 新建走 createArticle，编辑走 updateArticle。
 */
function onSubmit({ payload, publish }) {
  if (id.value) {
    store.updateArticle(id.value, payload)
  } else {
    store.createArticle(payload, publish)
  }
  router.replace('/articles')
}

function onCancel() {
  router.replace('/articles')
}
</script>

<template>
  <div class="view-container">
    <!-- 查无此文：给个明确提示，而不是让用户对着一个空表单发呆 -->
    <div class="panel article-notice" v-if="notFound">
      <p class="article-notice-title">找不到这篇文章</p>
      <p class="article-notice-desc">
        文章可能已经被删除了（ID：<code class="nf-path">{{ id }}</code>）。
      </p>
      <div class="notice-actions">
        <RouterLink class="btn btn-primary" to="/articles">返回文章列表</RouterLink>
      </div>
    </div>

    <ArticleFormSection
      v-else
      :key="formKey"
      :article="article"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </div>
</template>