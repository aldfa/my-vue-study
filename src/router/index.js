/**
 * ============================================================
 * 【路由配置】src/router/index.js
 * ============================================================
 * vue-router 4 的三个核心概念：
 *
 * 1. createRouter —— 创建路由实例（history 模式选哪种）
 * 2. routes      —— 路由表：path ↔ component 的映射关系
 * 3. <RouterView>—— 渲染「当前 path 对应的那个组件」
 *
 * 当前用的是 createWebHistory（History 模式）：
 *   地址栏是 /profile、/projects 这种干净路径，没有 # 号。
 *   代价：直接刷新 /profile 时，浏览器会向服务器请求 /profile，
 *        服务器必须回传 index.html 才能让路由接管。
 *        → 开发环境靠 vite 的 historyApiFallback
 *        → 生产环境需要服务器/Nginx 配 rewrite，或改用 createWebHashHistory
 * ============================================================
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'

/**
 * 需要登录才能访问的路径。
 *
 * 这里没有逐条路由写 meta.requiresAuth，而是集中列一个前缀表 ——
 * 「文章管理的所有子路由都要登录」这件事，用 4 条 meta 写 4 遍很容易漏，
 * 新增 /articles/xxx 时又得记得补。集中声明，守卫统一读它。
 * （另一种写法是给 /articles 路由加一个 children，语义更「原生」，
 *   但本项目文章路由都是平铺的 path，用前缀表改动最小。）
 */
const AUTH_REQUIRED_PREFIXES = ['/articles', '/projects', '/edit']

/** 判断某个 path 是否属于「需要登录」的页面 */
function requiresAuth(path) {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

const routes = [
  { path: '/', redirect: '/profile' },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    // meta 会被挂到 $route.meta 上，用来驱动顶栏标题
    meta: { title: '个人信息', sub: '查看你的基础档案与个人简介' },
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('../views/SkillsView.vue'),
    meta: { title: '技能标签', sub: '检索与浏览你掌握的技能关键词' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('../views/ProjectsView.vue'),
    meta: { title: '项目经历', sub: '记录你完成的项目与实践' },
  },
  {
    path: '/hobbies',
    name: 'hobbies',
    component: () => import('../views/HobbiesView.vue'),
    meta: { title: '兴趣爱好', sub: '展示学习之外的热爱与生活' },
  },
  {
    path: '/edit',
    name: 'edit',
    component: () => import('../views/EditView.vue'),
    meta: { title: '编辑资料', sub: '修改并保存你的个人信息' },
  },

  /* ---- 文章管理（4 条路由对应 3 个页面组件）----
     注意两点：
     1. /articles/new 必须排在 /articles/:id 前面。
        下面那两条已经用 (:id\\d+) 限定了「id 必须是数字」，所以 new 不会被吃掉，
        但把具体的路径写在通配参数前面，是路由表的基本阅读顺序。
     2. 新建和编辑共用 ArticleEditorView —— 「有没有 id 参数」决定它是新建还是编辑，
        见该组件里的说明。 */
  {
    path: '/articles',
    name: 'articles',
    component: () => import('../views/ArticlesView.vue'),
    meta: { title: '文章管理', sub: '新建、编辑、发布与删除你的文章' },
  },
  {
    path: '/articles/new',
    name: 'article-new',
    component: () => import('../views/ArticleEditorView.vue'),
    meta: { title: '新建文章', sub: '撰写内容，保存为草稿或直接发布' },
  },
  {
    // :id(\\d+) 是「自定义正则」写法：id 段只认数字。
    // 这样 /articles/new、/articles/abc 都不会误命中这条规则，
    // 前者由上面的固定路由接住，后者落到 404。
    path: '/articles/:id(\\d+)',
    name: 'article-detail',
    component: () => import('../views/ArticleDetailView.vue'),
    meta: { title: '文章详情', sub: '阅读已发布的文章内容' },
  },
  {
    path: '/articles/:id(\\d+)/edit',
    name: 'article-edit',
    component: () => import('../views/ArticleEditorView.vue'),
    meta: { title: '编辑文章', sub: '修改文章内容并保存' },
  },

  /* ---- 身份验证页 ----
     实验要求 5 的「登录页」。本实验不做真实登录，
     页面上只有一个「模拟登录」按钮，点一下 userStore.signIn() 就写入登录态。
     guestOnly 的含义正好和 requiresAuth 相反：
     已登录时不该再看到这个页面，守卫会把他送回原来想去的地方。 */
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '身份验证', sub: '管理页面需要验证身份后才能访问', guestOnly: true },
  },

  /* ---- 404 兜底路由 ----
     :pathMatch(.*)* 是 vue-router 4 的通配语法，
     匹配任何没被上面规则拦下的地址。
     必须放在 routes 数组最后一行，否则正常的 /profile 也会被它吃掉。 */
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在', sub: '你访问的地址可能已被移动或删除' },
  },
]

const router = createRouter({
  // import.meta.env.BASE_URL 来自 vite.config.js 的 base 配置，
  // 打包到子目录时用它做前缀，写死 '/' 在子目录下会 404
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * 全局前置守卫：在每次跳转「之前」执行。
 *
 * 这里干两件事：设置浏览器标签标题 + 登录态访问控制。
 *
 * 写法上 vue-router 4 推荐【直接 return 值】而不是用 next()：
 *   不 return            → 放行，等价于 next()
 *   return false         → 中断跳转，停在原地
 *   return '/somewhere'  → 改成跳去那个地址
 *   return { path, query } → 带参数跳转（本项目的重定向就用了这种）
 *
 * ------------------------------------------------------------
 * 【关键】useUserStore() 必须写在守卫函数体【内部】
 * ------------------------------------------------------------
 * 绝对不能在模块顶层写 const user = useUserStore()。
 *
 * 原因：这个文件被 main.js import 的那一刻，createPinia() 还没执行，
 * 此时调用 useUserStore() 会直接抛：
 *   "getActivePinia() was called but there was no active Pinia"
 *
 * 守卫的函数体是在【每次导航时】才执行的，那一刻应用早已
 * createApp().use(pinia).use(router) 安装完毕，所以这里拿得到 store。
 * （实验原理 3.1.4 强调的就是这一点。）
 */
router.beforeEach((to) => {
  /* ① 标签标题：meta 是每个页面在路由表里自带的说明 */
  const title = to.meta?.title
  document.title = title ? `${title} · 学生个人档案` : '学生个人档案'

  /* ② 登录态校验：在守卫内部取 store（原因见上方注释） */
  const userStore = useUserStore()

  /* 未登录要进受保护页面 → 踢到登录页，
     并用 query.redirect 记住他本来想去哪，登录后自动送回去。 */
  if (requiresAuth(to.path) && !userStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  /* 反过来：已经登录了就不该再看登录页，直接送回 redirect 或首页。
     这样「已登录状态下的退出登录」不会把自己卡在 /login 上。 */
  if (to.meta?.guestOnly && userStore.isLoggedIn) {
    return to.query.redirect || '/profile'
  }

  /* 走到这里说明不需要干预，返回 undefined 即放行 */
  return true
})

export default router