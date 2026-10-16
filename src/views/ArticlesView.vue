<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/ArticlesView.vue
 * 路由：/articles  （内容管理 / 文章列表）
 * ============================================================
 * 整个「文章管理」的主页面，承担 4 件事：
 *   1. 顶部筛选：全部文章 / 已发布 / 草稿（筛选状态存在 URL 的 ?status= 上）
 *   2. 关键词搜索
 *   3. 渲染文章卡片
 *   4. 单篇文章的编辑 / 发布(转草稿) / 删除
 *
 * 【职责边界】
 * 这个页面是唯一调用 article store 写方法的地方 —— 卡片组件只负责渲染，
 * 表单组件只负责 emit。于是「数据怎么存」这件事始终收在一个文件里。
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import ArticleCard from '../components/ArticleCard.vue'
import ArticleFilterTabs from '../components/ArticleFilterTabs.vue'
import { useArticleStore, ARTICLE_STATUS } from '../stores/articleStore'

const route = useRoute()

/** setup 里取 store 实例；组件里直接用 store.xxx，Pinia 已自动解包 ref */
const store = useArticleStore()

/**
 * storeToRefs（实验要求 3）：
 * articles / summary 都是 store 的 state 和 getter，
 * 拆出来后可以直接用在模板和 computed 里，响应式不断。
 * 而 action（listByStatus / toggleStatus ...）不在这里拆，仍从 store 上调。
 */
const { summary } = storeToRefs(store)

/** 搜索关键词 —— 这个只活在当前页面，放 URL 反而碍事 */
const keyword = ref('')

const VALID_FILTERS = ['all', ARTICLE_STATUS.PUBLISHED, ARTICLE_STATUS.DRAFT]

/**
 * 当前筛选项，直接读 URL。
 * 这里必须和 ArticleFilterTabs 用同一份校验规则：
 * 手输 /articles?status=xxx 时，两边都要把非法值当成「全部」，
 * 否则会出现「三个标签都没高亮，但列表却是空的」这种错位状态。
 */
const filter = computed(() => {
  const q = route.query.status
  return VALID_FILTERS.includes(q) ? q : 'all'
})

/** 三个标签上的数量角标。
    现在直接取 store 的 summary getter —— 这类「由 articles 算出来的数字」
    属于派生数据，声明在 store 里才有缓存，也只有一处实现。 */
const counts = computed(() => ({
  all: summary.value.total,
  published: summary.value.published,
  draft: summary.value.draft,
}))

/**
 * 列表 = 按状态过滤 → 再按关键词过滤。
 * 关键词同时匹配标题和摘要，任一命中就保留。
 */
const list = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const byStatus = store.listByStatus(filter.value)
  if (!kw) return byStatus
  return byStatus.filter(
    (a) => a.title.toLowerCase().includes(kw) || (a.summary || '').toLowerCase().includes(kw),
  )
})

/** 空列表的三种成因，提示语要区分开，否则「这个分类本来就是空的」会显示成「你还没写过」 */
const emptyTitle = computed(() => {
  if (keyword.value.trim()) return '没有匹配的文章'
  if (filter.value !== 'all') return filter.value === 'published' ? '还没有已发布的文章' : '没有草稿'
  return '这里还没有文章'
})

const emptyDesc = computed(() => {
  if (keyword.value.trim()) return '换个关键词试试，或者清空筛选条件。'
  if (filter.value !== 'all') return '新建一篇文章，或者把草稿发布出来。'
  return '点右上角「新建文章」开始写第一篇吧。'
})

/** 发布 / 转为草稿。列表页和详情页都能触发，这里是列表上的那一处 */
function toggleStatus(id) {
  store.toggleStatus(id)
}

/** 删除。这是不可逆操作，必须二次确认 */
function removeArticle(id) {
  const target = store.getById(id)
  if (!target) return
  if (!confirm(`确定要删除《${target.title}》吗？删除后无法恢复。`)) return
  store.removeArticle(id)
}
</script>

<template>
  <div class="view-container">
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">内容管理</h2>
        <!-- 列表页唯一的「新建」入口 -->
        <RouterLink class="btn btn-primary btn-sm" to="/articles/new">＋ 新建文章</RouterLink>
      </div>

      <!-- ① 状态筛选 -->
      <ArticleFilterTabs :counts="counts" />

      <!-- ② 关键词搜索（复用技能页那套输入框样式） -->
      <div class="article-search">
        <input type="text" v-model="keyword" placeholder="输入关键词筛选文章（标题或摘要）..." />
        <button class="clear-btn" @click="keyword = ''">清空</button>
      </div>

      <p class="article-count">
        {{ filter === 'all' ? '全部文章' : filter === 'published' ? '已发布' : '草稿' }}
        · 共 {{ list.length }} 篇
        <template v-if="keyword.trim()">（已按「{{ keyword.trim() }}」筛选）</template>
      </p>

      <!-- 概览条：数据全部来自 articleStore 的 summary getter（computed，有缓存） -->
      <p class="article-summary">
        <span>全部 <strong>{{ summary.total }}</strong> 篇</span>
        <span>已发布 <strong>{{ summary.published }}</strong> 篇</span>
        <span>草稿 <strong>{{ summary.draft }}</strong> 篇</span>
        <span>累计阅读 <strong>{{ summary.views }}</strong> 次</span>
      </p>

      <!-- ③ 列表 -->
      <div class="article-list" v-if="list.length > 0">
        <ArticleCard v-for="item in list" :key="item.id" :article="item">
          <!-- 标题插槽：已发布的文章标题可点击查看，草稿保持纯文字 -->
          <template #title="{ article, published }">
            <h3 class="article-name">
              <RouterLink v-if="published" class="article-link" :to="`/articles/${article.id}`">
                {{ article.title }}
              </RouterLink>
              <template v-else>{{ article.title }}</template>
            </h3>
          </template>

          <!-- 操作插槽：按钮的组合由状态决定 -->
          <template #actions="{ article, published }">
            <!-- 只有已发布的文章能查看，草稿不给这个入口 -->
            <RouterLink
              v-if="published"
              class="btn btn-secondary btn-sm"
              :to="`/articles/${article.id}`"
            >查看</RouterLink>

            <RouterLink
              class="btn btn-secondary btn-sm"
              :to="`/articles/${article.id}/edit`"
            >编辑</RouterLink>

            <button class="btn btn-secondary btn-sm" @click="toggleStatus(article.id)">
              {{ published ? '转为草稿' : '发布' }}
            </button>

            <button class="btn btn-danger btn-sm" @click="removeArticle(article.id)">删除</button>
          </template>
        </ArticleCard>
      </div>

      <!-- ④ 空状态 -->
      <div v-else class="article-notice">
        <p class="article-notice-title">{{ emptyTitle }}</p>
        <p class="article-notice-desc">{{ emptyDesc }}</p>
        <div class="notice-actions">
          <RouterLink class="btn btn-primary" to="/articles/new">＋ 新建文章</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>