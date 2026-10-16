/**
 * ============================================================
 * 【Pinia Store】src/stores/articleStore.js
 * ============================================================
 * 文章模块的 Setup Store，结构见 profileStore.js 的说明。
 *
 * ============================================================
 * 迁移时最容易踩的坑：从 reactive 对象改成 Setup Store 之后，
 * 方法里【不能再用 this】
 * ============================================================
 * 之前（reactive 对象）：
 *   getById(id) { return this.articles.find(...) }
 *
 * 现在（Setup Store）：
 *   getById(id) { return articles.value.find(...) }
 *
 * 原因：Setup Store 的第二个参数是个普通函数，它的 this 不指向 store。
 * 必须直接闭包引用上面声明的 ref，所以都要写 articles.value。
 *
 * 反过来，【组件里】不需要写 .value —— Pinia 会自动解包：
 *   store.articles          ✅ 组件 / setup 里
 *   articles.value          ✅ 只在 store 内部
 *
 * ============================================================
 * 持久化：刷新后不再回到 4 篇种子数据
 * ============================================================
 * 之前这里只存内存，刷新页面就重置。
 * 现在 state 初值改成 loadState(key, 种子数据)，
 * 并且每个【写 action】末尾调一次 persist()。
 *
 * 注意只在写 action 里存：
 *   createArticle / updateArticle / toggleStatus / removeArticle / recordView
 *   —— 这五个会改变 articles。getById、listByStatus 只是读，不碰存储。
 * ============================================================
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadState, removeState, saveState } from './storage'

/** 本 store 的持久化 key */
const STORAGE_KEY = 'articles'

/* ============================================================
 * 状态常量
 * ============================================================
 * 文章只有两种状态，用常量而不是到处写字符串 'published'，
 * 拼错字时不会静默出错，反而会立刻找不到匹配项。
 * 注意这是模块级导出，不是 store 的一部分 ——
 * 组件里可以直接 import 它，不需要先拿到 store 实例。
 * ============================================================ */
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
}

/** 状态 → 中文，模板里直接 {{ STATUS_TEXT[article.status] }} */
export const STATUS_TEXT = {
  [ARTICLE_STATUS.DRAFT]: '草稿',
  [ARTICLE_STATUS.PUBLISHED]: '已发布',
}

/* ============================================================
 * 种子数据（首次访问 / 恢复出厂设置时使用）
 * ============================================================ */
const SEED_ARTICLES = [
  {
    id: 1,
    title: 'Vue 3 组合式 API 实战总结',
    summary: '从 Options API 迁移到 <script setup> 的过程中，我踩过的坑和总结出的写法约定。',
    content:
      '从 Options API 迁到 <script setup> 之后，组件的结构一下子清爽了很多。\n\n' +
      '最明显的收益是「逻辑复用」变得自然。把一段带状态的逻辑抽成一个 composable（useXxx），' +
      '函数内部正常声明 ref / computed，外部像用普通函数一样调用即可。\n\n' +
      '需要注意的坑有三个：一是别忘了 .value，写模板里可以省，脚本里省不掉；' +
      '二是解构会丢掉响应式，要用 toRefs 或者直接在模板里访问源对象；' +
      '三是 defineProps 拿到的 props 是只读的，要改就得 emit 给父组件。\n\n' +
      '总的来说，写法统一之后心智负担小了很多，值得。',
    tags: ['Vue', '前端', '总结'],
    status: ARTICLE_STATUS.PUBLISHED,
    views: 128,
    createdAt: '2025-03-08',
    updatedAt: '2025-04-02',
    publishedAt: '2025-04-02',
  },
  {
    id: 2,
    title: '用 Vite 搭建前端项目的十个配置技巧',
    summary: '别名、代理、环境变量、代码分割……这些配置让开发体验好了不止一个档次。',
    content:
      'Vite 的默认配置已经很好用了，但下面这几个改动几乎每个项目都会用到。\n\n' +
      '第一是别名。jsconfig.json（或 tsconfig.json）里配 paths，再在 vite.config.js 里配 resolve.alias，' +
      '之后 import 就写成 @/components/xxx，不用再数 ../ 有几层。\n\n' +
      '第二是开发代理。跨域请求交给 Vite 转发，前端代码里直接写 /api 就够了，不用管后端跑在哪台机器上。\n\n' +
      '第三是路由懒加载。component: () => import(...) 是 vue-router 里的标准写法，' +
      '每个页面会打成一个独立的 chunk，首屏只加载真正用到的那个。',
    tags: ['Vite', '工程化'],
    status: ARTICLE_STATUS.PUBLISHED,
    views: 76,
    createdAt: '2025-05-11',
    updatedAt: '2025-05-11',
    publishedAt: '2025-05-11',
  },
  {
    id: 3,
    title: 'CSS Flex 布局常见坑点整理（草稿）',
    summary: '写了一半，主要记录 min-width: auto 导致的溢出问题。',
    content:
      'Flex 布局里最常见的坑是子项不换行直接撑破容器。\n\n' +
      '原因是 flex 子项的 min-width 默认是 auto，也就是说它至少要撑到内容本身的宽度。' +
      '解决办法是给子项加 min-width: 0，这在多栏布局里几乎必须写。\n\n' +
      '（待补充：align-items 与 align-self 的区别、gap 的浏览器兼容问题。）',
    tags: ['CSS', '布局'],
    status: ARTICLE_STATUS.DRAFT,
    views: 0,
    createdAt: '2025-06-20',
    updatedAt: '2025-06-25',
    publishedAt: '',
  },
  {
    id: 4,
    title: '数据结构与算法学习计划',
    summary: '按优先级排的学习路线，先刷高频题再补理论。',
    content:
      '计划分三步：\n\n' +
      '1. 数组与字符串：双指针、滑动窗口；\n' +
      '2. 链表与栈队列：反转、前缀和；\n' +
      '3. 二分查找与树：递归转迭代。\n\n' +
      '每刷完一类就用博客记录一道自己一开始没想出来的题，比刷十道会的题有用。',
    tags: ['算法', '计划'],
    status: ARTICLE_STATUS.DRAFT,
    views: 0,
    createdAt: '2025-07-01',
    updatedAt: '2025-07-04',
    publishedAt: '',
  },
]

export const useArticleStore = defineStore('articles', () => {
  /* ---------- 文章数据 ----------
     初值 = localStorage 存档，没有才用种子数据。
     整份数据一起存成一个对象（而不是每篇文章一个键），
     这样一次读写就是全量同步，不存在「存了一半」的中间态。 */
  const articles = ref(loadArticles())
  const lastId = ref(loadLastId())

  /* ============================================================
   * Getters（派生数据）
   * ============================================================
   * 「按状态过滤并计数」这类纯计算不属于 state，声明成 computed：
   *   - 有缓存，依赖不变时只算一次；
   *   - 依赖一变自动更新，页面不用手动调 refresh。
   *
   * getter 的限制：不能接收参数。需要参数（按 id 查、按状态查）的
   * 仍然是下方 action 里的 listByStatus / getById。
   * ============================================================ */

  /** 文章总数 */
  const totalCount = computed(() => articles.value.length)

  /** 已发布的文章，详情页的「上一篇」之类的入口会用到 */
  const publishedList = computed(() =>
    articles.value.filter((item) => item.status === ARTICLE_STATUS.PUBLISHED),
  )

  /** 草稿列表 */
  const draftList = computed(() =>
    articles.value.filter((item) => item.status === ARTICLE_STATUS.DRAFT),
  )

  /** 全部文章的总阅读量 */
  const totalViews = computed(() =>
    articles.value.reduce((sum, item) => sum + (Number(item.views) || 0), 0),
  )

  /**
   * 所有标签去重后的合集。
   * 用来渲染标签云 / 标签筛选器 —— 这种「把所有文章的 tags 摊平再去重」
   * 的活如果放在组件里写，每个用到它的页面都得抄一遍。
   */
  const allTags = computed(() => {
    const set = new Set()
    articles.value.forEach((item) => (item.tags || []).forEach((t) => set.add(t)))
    return [...set]
  })

  /** 概览数据：文章数、草稿数、阅读量，列表页顶部的统计条直接用 */
  const summary = computed(() => ({
    total: totalCount.value,
    published: publishedList.value.length,
    draft: draftList.value.length,
    views: totalViews.value,
  }))

  /* ============================================================
   * Actions：查询
   * ============================================================ */

  /** 按 id 取文章，查不到返回 null —— 调用方必须自己兜底，不要假设它一定存在 */
  function getById(id) {
    return articles.value.find((item) => item.id === Number(id)) || null
  }

  /**
   * 按状态过滤。
   * status 传 'all'、空值都不传时返回全部（列表页默认就是全部文章）。
   */
  function listByStatus(status) {
    if (!status || status === 'all') return articles.value
    return articles.value.filter((item) => item.status === status)
  }

  /** 统计数量，给筛选标签上的角标用 */
  function countByStatus(status) {
    if (!status || status === 'all') return articles.value.length
    return articles.value.filter((item) => item.status === status).length
  }

  /* ============================================================
   * Actions：写入
   * ============================================================
   * 每个写 action 的最后一行都是 persist()。
   * 新增一个写操作时别忘了加，否则刷新后这次改动就丢了。
   * ============================================================ */

  /**
   * 写回 localStorage。持久化逻辑只存在于这一个函数里，
   * action 负责「改」，这个负责「存」，职责不混。
   */
  function persist() {
    saveState(STORAGE_KEY, {
      articles: articles.value,
      lastId: lastId.value,
    })
  }

  /**
   * 新建文章。publish 为 true 直接以「已发布」状态入库。
   * 返回新建出来的对象，调用方想拿 id 跳转可以直接用。
   */
  function createArticle(payload, publish = false) {
    const today = todayStr()
    const article = {
      id: ++lastId.value,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      tags: payload.tags,
      status: publish ? ARTICLE_STATUS.PUBLISHED : ARTICLE_STATUS.DRAFT,
      views: 0,
      createdAt: today,
      updatedAt: today,
      publishedAt: publish ? today : '',
    }
    // unshift：新建的排最前面，符合「最新在最上」的直觉
    articles.value.unshift(article)
    persist()
    return article
  }

  /**
   * 修改文章内容。注意这里【不碰 status】：
   * 「发布 / 转为草稿」是列表页的独立操作，不该被一次普通保存顺手改掉。
   */
  function updateArticle(id, payload) {
    const target = getById(id)
    if (!target) return null
    target.title = payload.title
    target.summary = payload.summary
    target.content = payload.content
    target.tags = payload.tags
    target.updatedAt = todayStr()
    persist()
    return target
  }

  /** 状态来回切：草稿 → 已发布，已发布 → 草稿 */
  function toggleStatus(id) {
    const target = getById(id)
    if (!target) return null
    target.status =
      target.status === ARTICLE_STATUS.PUBLISHED
        ? ARTICLE_STATUS.DRAFT
        : ARTICLE_STATUS.PUBLISHED
    target.updatedAt = todayStr()
    if (target.status === ARTICLE_STATUS.PUBLISHED && !target.publishedAt) {
      target.publishedAt = todayStr()
    }
    persist()
    return target
  }

  /** 删除。先用 findIndex 拿位置，再 splice —— 响应式系统能侦测到 splice，自动更新视图 */
  function removeArticle(id) {
    const index = articles.value.findIndex((item) => item.id === Number(id))
    if (index > -1) {
      articles.value.splice(index, 1)
      persist()
    }
  }

  /** 打开一篇已发布文章时记一次阅读量；草稿不计数 */
  function recordView(id) {
    const target = getById(id)
    if (target && target.status === ARTICLE_STATUS.PUBLISHED) {
      target.views += 1
      persist()
    }
  }

  /**
   * 恢复出厂设置：删掉 localStorage 并把内存数据复位。
   * 用于演示「清空持久化后刷新回到 4 篇种子文章」。
   */
  function resetArticles() {
    removeState(STORAGE_KEY)
    articles.value = SEED_ARTICLES.map((a) => ({ ...a }))
    lastId.value = SEED_ARTICLES.length
  }

  return {
    // state
    articles,
    lastId,
    // getters
    totalCount,
    publishedList,
    draftList,
    totalViews,
    allTags,
    summary,
    // actions
    getById,
    listByStatus,
    countByStatus,
    createArticle,
    updateArticle,
    toggleStatus,
    removeArticle,
    recordView,
    resetArticles,
  }
})

/* ============================================================
 * 模块级工具函数
 * ============================================================ */

/**
 * 从 localStorage 读文章列表。
 * 和 profileStore.normalizeProjects 同一个思路 —— 持久化数据是「外部输入」，
 * 必须假设它可能缺失、可能不是数组，形状不对就回退到种子数据。
 */
function loadArticles() {
  const saved = loadState(STORAGE_KEY, null)
  if (!saved || !Array.isArray(saved.articles) || saved.articles.length === 0) {
    return SEED_ARTICLES.map((a) => ({ ...a }))
  }
  return saved.articles
}

/**
 * 读自增 id 游标。
 * 存档里没有 lastId 时（比如手动改坏过数据）就从现有文章里反推最大值，
 * 保证 id 不会和已有文章撞号。
 */
function loadLastId() {
  const saved = loadState(STORAGE_KEY, null)
  if (saved && Number.isFinite(saved.lastId)) return saved.lastId
  return SEED_ARTICLES.reduce((max, a) => Math.max(max, a.id), 0)
}

/** 当天的 YYYY-MM-DD */
function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}