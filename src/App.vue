<template>
  <div id="app">
    <!-- ========== 左侧：仪表盘式导航栏 ========== -->
    <!-- AppHeader 不再接收 currentPage / navigate：
         跳转和高亮都交给它内部的 <RouterLink> 自己处理，
         这里只留「主题开关」这个纯 UI 状态的 emit。 -->
    <AppHeader
      :name="student.name"
      :isDark="isDark"
      :isLoggedIn="isLoggedIn"
      :displayName="displayName"
      @toggle-theme="toggleTheme"
      @sign-out="signOut"
    >
      <template #nav-extra>
        <a class="rail-link" href="https://github.com/" target="_blank" rel="noopener">GitHub ↗</a>
      </template>
    </AppHeader>

    <!-- ========== 右侧：内容区 ========== -->
    <div class="content-area">
      <!-- 顶栏：标题直接读「当前路由的 meta」，不再手动维护 PAGE_META 映射表。
           $route.meta 就是 router/index.js 里每条路由写的那段 meta。 -->
      <header class="topbar">
        <div class="topbar-text">
          <h1 class="topbar-title">{{ $route.meta.title }}</h1>
          <p class="topbar-sub">{{ $route.meta.sub }}</p>
        </div>
        <span class="topbar-date">{{ today }}</span>
      </header>

      <!-- ========== 主体：路由出口 + 唯一滚动容器 ==========
           <RouterView /> 就是「当前 URL 对应那个组件」的挂载点。
           原来手写的 v-if / v-else-if 切换逻辑，现在全部交给
           router/index.js 里的路由表决定渲染谁。

           为什么不用默认的 <RouterView /> 而要带 v-slot？
             默认写法渲染出来没法和 <Transition> 配合。
             用作用域插槽把「要渲染的组件」解构出来（Component），
             再交给 Transition 包装，才能实现淡入淡出。

           <component :is="Component" /> 是动态组件写法：
           Component 是什么就渲染什么 —— 这就是「切换页面」的底层原理。

           mode="out-in" 让旧页面先离场、新页面再进场，两者不会重叠。 -->
      <main class="main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <!-- 底部 -->
      <AppFooter :student="student" :students="students">
        <div class="footer-nav-links">
          <!-- 页脚也用 RouterLink，全站只保留一种跳转方式，方便统一维护 -->
          <RouterLink to="/profile">首页</RouterLink>
          <a href="mailto:*********@qq.com">联系我</a>
        </div>
      </AppFooter>
    </div>
  </div>
</template>

<script>
/**
 * ============================================================
 * 【App.vue】应用外壳（layout）
 * ============================================================
 * 路由化之后，App.vue 的职责变小了 —— 它不再决定「显示哪个页面」，
 * 只负责画外壳：左侧导航 + 顶栏 + 路由出口 + 底部。
 *
 * 三件事的变化：
 *  1. 不再 import 5 个 View 组件 —— 页面由路由表按需加载（见 router/index.js）
 *  2. 不再有 currentPage / navigate / PAGE_META —— 交给 $route
 *  3. 业务数据（姓名、技能、项目…）搬到 src/stores/profileStore.js
 *     因为 <RouterView /> 无法接收 props，页面只能自己 import store
 *
 * 保留在 App.vue 的只有「全局 UI 状态」：主题开关。
 * 主题不属于任何单个页面，所以由外壳统一管理。
 * ============================================================
 */
import { useProfileStore, generateAvatarDataUrl } from './stores/profileStore'
import { useUserStore } from './stores/userStore'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: {
    AppFooter,
    AppHeader,
    // 注意：这里刻意不注册 ProfileView / SkillsView ...，
    // 它们由 router/index.js 的 component 字段负责加载。
  },

  /**
   * Pinia 在 Options API 组件里怎么用？用 setup() 取出 store。
   * 注意是「在 setup 里调用」而不是写在 computed 里 ——
   * store 必须在 setup 执行时创建，Pinia 才知道该把它挂到哪个 app 上。
   */
  setup() {
    return {
      profile: useProfileStore(),
      /**
       * 登录态同样来自 store。
       *
       * 两个 store 都在 setup 里取（不是 data、不是 computed），
       * 因为 store 必须挂到当前 app 上才能创建 —— 见上方注释。
       */
      user: useUserStore(),
    }
  },

  data() {
    return {
      /* 只剩主题这一个全局 UI 状态 */
      isDark: false,
    }
  },

  computed: {
    /**
     * 导航栏和底部要显示学生姓名 / 联系方式。
     * 直接从 Pinia store 读，不用再靠 props 往下传。
     */
    student() {
      return this.profile.student
    },
    students() {
      return this.profile.students
    },

    /**
     * 登录态。
     *
     * 这里能直接读 getter（this.user.isLoggedIn），
     * 说明 store 的 getter 在 Options API 里和 state 用法完全一致。
     */
    isLoggedIn() {
      return this.user.isLoggedIn
    },

    displayName() {
      return this.user.displayName
    },

    /** 顶栏右侧的日期 */
    today() {
      const d = new Date()
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    },
  },

  methods: {
    /**
     * 切换亮/暗主题。
     * 做法是把 dark-theme 类名挂到 <body> 上，
     * CSS 里 .dark-theme 那一组变量就会覆盖 :root 的默认值。
     */
    toggleTheme() {
      this.isDark = !this.isDark
      document.body.classList.toggle('dark-theme', this.isDark)
      try {
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
      } catch (e) { /* 隐私模式下 localStorage 可能不可写，忽略即可 */ }
    },

    /**
     * 退出登录。
     *
     * 真正的状态变更在 userStore.signOut() 里完成（含清 localStorage），
     * 这里只负责补一步「离开当前页面」：
     * 你在受保护页面上退出后，路由守卫下一次导航就会把你弹回登录页，
     * 但【当前这次】不会自动跳转，所以要手动去一个公开页。
     */
    signOut() {
      this.user.signOut()
      if (this.$route.path !== '/login') {
        this.$router.replace('/profile')
      }
    },
  },

  mounted() {
    /* ① 恢复上次的主题选择 */
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        this.isDark = true
        document.body.classList.add('dark-theme')
      }
    } catch (e) { }

    /* ② 用姓名首字母生成头像，写进 Pinia store 给 ProfileView 用 */
    this.profile.avatarUrl = generateAvatarDataUrl(this.profile.student.name)
  },
}
</script>

<style>
/* ========== 全局重置 ========== */
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-page: #edf1f8;
  --bg-card: #ffffff;
  --bg-soft: #f4f7fc;
  --text-1: #1c2a45;
  --text-2: #556380;
  --text-3: #93a0b8;
  --border: #e3e9f3;
  --accent: #3b6ef5;
  --accent-deep: #2c5ce0;
  --accent-soft: #eaf1ff;
  --shadow-sm: 0 1px 2px rgba(28, 42, 69, 0.06);
  --shadow-md: 0 14px 40px rgba(40, 70, 130, 0.14);
  --radius: 14px;
}

.dark-theme {
  --bg-page: #0d1526;
  --bg-card: #16203a;
  --bg-soft: #1c2845;
  --text-1: #e8edf7;
  --text-2: #aab6cc;
  --text-3: #6b7894;
  --border: #253356;
  --accent: #6b9bff;
  --accent-deep: #85adff;
  --accent-soft: #202f5a;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 14px 40px rgba(0, 0, 0, 0.45);
}

body {
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  background: var(--bg-page);
  color: var(--text-1);
  min-height: 100vh;
  padding: 32px 24px;
  transition: background 0.3s ease, color 0.3s ease;
}

/* ========== 整体外框：固定尺寸，切换页面不波动 ========== */
#app {
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 64px);
  min-height: 560px;
  max-height: 860px;
  display: flex;
  align-items: stretch;
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ========== 左侧导航栏（白色仪表盘风格） ========== */
.site-header {
  width: 208px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.header-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 22px 14px 18px;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px;
  text-decoration: none;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--accent) 0%, #7a6bff 100%);
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name { display: block; font-size: 15px; font-weight: 700; color: var(--text-1); }
.brand-sub { display: block; font-size: 11px; color: var(--text-3); margin-top: 2px; }

.header-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.nav-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 9px;
  background: none;
  color: var(--text-2);
  font-size: 13.5px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.nav-btn .nav-icon { width: 18px; text-align: center; font-size: 14px; flex-shrink: 0; }

.nav-btn:hover { background: var(--bg-soft); color: var(--text-1); }

.nav-btn.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

.nav-btn.active::before {
  content: "";
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
}

.header-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.rail-link {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--text-2);
  text-decoration: none;
  text-align: center;
  transition: background 0.2s, color 0.2s;
}

.rail-link:hover { background: var(--bg-soft); color: var(--accent); }

/* <RouterLink> 渲染出来是 <a>，默认带下划线，这里去掉。
   .brand 和 .nav-btn 同样要处理，因为它们也换成了 RouterLink。 */
.brand,
.nav-btn,
.footer-nav-links a { text-decoration: none; }

.header-toggle {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.header-toggle:hover { border-color: var(--accent); color: var(--accent); }

/* ========== 顶栏 ========== */
.topbar {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 28px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.topbar-title { font-size: 17px; font-weight: 700; color: var(--text-1); }
.topbar-sub { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.topbar-date { font-size: 12.5px; color: var(--text-3); white-space: nowrap; }

/* ========== 主内容区（唯一滚动容器，滚动条槽位常驻防抖动） ========== */
.main {
  flex: 1;
  min-height: 0;
  padding: 22px 28px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

/* 页面过渡：仅淡入淡出 + 轻微位移，不影响布局 */
.page-enter-active, .page-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }

/* 视图容器基线：每个页面都填满同一尺寸 */
.view-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* ========== 统一卡片基线 .panel ========== */
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.panel-title {
  position: relative;
  padding-left: 11px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1.2;
}

/* 标题栏右侧的容器：统计文字 + 插槽传进来的操作按钮排在同一行 */
.panel-head-extra { display: flex; align-items: center; gap: 10px; }

.panel-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: var(--accent);
}

.btn-link {
  border: none;
  background: none;
  color: var(--accent);
  font-size: 12.5px;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-link:hover { background: var(--accent-soft); }

/* ========== 个人信息页：左身份卡 + 右简介 ========== */
.profile-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 258px 1fr;
  gap: 18px;
}

.identity-head {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 15px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.avatar {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 3px solid var(--accent-soft);
  background: #eef2ff;
  object-fit: cover;
  flex-shrink: 0;
}

.identity-head .name { font-size: 18px; font-weight: 700; color: var(--text-1); margin-bottom: 3px; }
.identity-head .major { font-size: 12.5px; color: var(--text-3); }

.identity-info { list-style: none; display: flex; flex-direction: column; }

.identity-info li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.identity-info .label { color: var(--text-3); flex-shrink: 0; }
.identity-info .value { color: var(--text-2); text-align: right; word-break: break-all; }

.identity-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: auto;
  padding-top: 15px;
}

.stat-box {
  background: var(--bg-soft);
  border-radius: 10px;
  padding: 9px 4px;
  text-align: center;
  transition: background 0.3s ease;
}

.stat-num { display: block; font-size: 17px; font-weight: 700; color: var(--accent); }
.stat-label { display: block; font-size: 11px; color: var(--text-3); margin-top: 2px; }

.intro-text {
  font-size: 14px;
  line-height: 1.95;
  color: var(--text-2);
}

.details-collapse {
  overflow: hidden;
  max-height: 500px;
  opacity: 1;
  transition: max-height 0.35s ease, opacity 0.25s ease;
}

.details-collapse.collapsed { max-height: 0; opacity: 0; }

/* ========== 搜索框（技能页、文章列表页共用，所以列了两个类名） ========== */
.skill-search,
.article-search { display: flex; gap: 10px; margin-bottom: 12px; }

.skill-search input,
.article-search input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
  color: var(--text-1);
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.3s ease;
}

.skill-search input:focus,
.article-search input:focus {
  border-color: var(--accent);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(59, 110, 245, 0.14);
}

.skill-search input::placeholder,
.article-search input::placeholder { color: var(--text-3); }

.clear-btn {
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 13px;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.clear-btn:hover { border-color: var(--accent); color: var(--accent); }

/* 技能页和文章列表页共用的「共 N 项」那一行小字 */
.skill-meta,
.article-count { font-size: 12px; color: var(--text-3); margin-bottom: 12px; }

.tags { display: flex; flex-wrap: wrap; gap: 9px; min-height: 32px; }

.tag {
  font-size: 13px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 6px 15px;
  border-radius: 999px;
  cursor: default;
  transition: background 0.2s, color 0.2s;
}

.tag:hover { background: var(--accent); color: #ffffff; }

.empty-hint { font-size: 13px; color: var(--text-3); padding: 6px 0; }

/* ========== 项目页：卡片列表 ========== */
.project-list { display: flex; flex-direction: column; gap: 14px; }

.project-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.project-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 22px rgba(59, 110, 245, 0.1);
  transform: translateY(-2px);
}

.project-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.project-name { font-size: 15px; font-weight: 700; color: var(--text-1); }

.badge {
  font-size: 11.5px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 3px 11px;
  border-radius: 999px;
  white-space: nowrap;
}

.project-desc { font-size: 13px; line-height: 1.85; color: var(--text-2); }

/* ========== 兴趣爱好页 ========== */
.hobby-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.hobby-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: default;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.hobby-emoji { font-size: 34px; line-height: 1; transition: transform 0.2s; }
.hobby-name { font-size: 13.5px; font-weight: 600; color: var(--text-2); }

.hobby-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 22px rgba(59, 110, 245, 0.1);
  transform: translateY(-3px);
}

.hobby-card:hover .hobby-emoji { transform: scale(1.12); }
.hobby-card:hover .hobby-name { color: var(--accent); }

/* ========== 编辑页 ========== */
.edit-panel { max-width: 660px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row.full { grid-column: 1 / -1; }

.form-row label { font-size: 12.5px; font-weight: 600; color: var(--text-2); }

.form-row input,
.form-row textarea {
  padding: 10px 13px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-soft);
  color: var(--text-1);
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.3s ease;
}

.form-row input:focus,
.form-row textarea:focus {
  border-color: var(--accent);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(59, 110, 245, 0.14);
}

.edit-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; flex-wrap: wrap; }

.btn {
  padding: 10px 22px;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn:active { transform: scale(0.97); }

.btn-primary { background: var(--accent); color: #ffffff; }
.btn-primary:hover { background: var(--accent-deep); }

.btn-secondary { background: var(--bg-soft); color: var(--text-2); border: 1px solid var(--border); }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

/* 小号按钮：放在卡片操作区 / 面板标题栏里的那种 */
.btn-sm { padding: 7px 14px; font-size: 12.5px; }

.btn-danger { background: rgba(214, 69, 69, 0.1); color: #d64545; }
.btn-danger:hover { background: #d64545; color: #ffffff; }

/* ========== 文章管理页：筛选标签 ========== */
/* 三个筛选项共用一个 path、只差 ?status=，
   所以用的是 button 而不是 RouterLink —— 自动高亮不比较 query，
   用 RouterLink 的话三个会同时点亮。 */
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.filter-tab:hover { border-color: var(--accent); color: var(--accent); }

.filter-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
  font-weight: 600;
}

.filter-count {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--text-3);
  transition: background 0.2s, color 0.2s;
}

.filter-tab.active .filter-count { background: rgba(255, 255, 255, 0.22); color: #ffffff; }

/* ========== 文章管理页：文章卡片 ========== */
.article-list { display: flex; flex-direction: column; gap: 14px; }

.article-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.article-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 22px rgba(59, 110, 245, 0.1);
  transform: translateY(-2px);
}

.article-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.article-name { font-size: 15px; font-weight: 700; color: var(--text-1); }

/* 已发布文章的标题可点击查看；草稿的标题是纯文字（父组件不给链接） */
.article-link { color: inherit; text-decoration: none; transition: color 0.2s; }
.article-link:hover { color: var(--accent); text-decoration: underline; }

/* 复用 .badge 的形状，只换配色 */
.badge-published { color: #1f9d55; background: rgba(31, 157, 85, 0.12); }
.badge-draft { color: var(--text-3); background: var(--bg-soft); }

.dark-theme .badge-published { color: #4ade80; background: rgba(74, 222, 128, 0.14); }
.dark-theme .btn-danger { color: #f87171; background: rgba(248, 113, 113, 0.12); }
.dark-theme .btn-danger:hover { background: #ef4444; color: #ffffff; }

.article-summary { font-size: 13px; line-height: 1.8; color: var(--text-2); }

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--text-3);
}

.article-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

/* ========== 文章管理页：表单 / 详情 / 空状态 ========== */
.article-form-panel,
.article-detail { max-width: 760px; }

.article-detail-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.45;
  color: var(--text-1);
}

.article-body { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
.article-body p { font-size: 14px; line-height: 2; color: var(--text-2); }

.article-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }

.article-tag {
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 4px 11px;
  border-radius: 999px;
}

/* 空列表 / 文章不存在 / 草稿提示，三处共用 */
.article-notice {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  padding: 40px 22px;
}

.article-notice-title { font-size: 17px; font-weight: 700; color: var(--text-1); }
.article-notice-desc { font-size: 13.5px; color: var(--text-3); max-width: 460px; line-height: 1.8; }

/* 提示块里的按钮组。样式和 404 页的 .nf-actions 完全一致，所以两条选择器并列，
   以后要改间距只改一处就行。 */
.nf-actions,
.notice-actions { display: flex; gap: 10px; margin-top: 18px; }

/* ========== 状态管理（实验四）新增样式 ========== */

/* 文章列表顶部的概览条：4 个数字，来自 articleStore 的 summary getter */
.article-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.article-summary span {
  font-size: 12.5px;
  color: var(--text-2);
  background: var(--bg-soft);
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: 999px;
}

.article-summary strong { color: var(--accent); font-weight: 700; }

/* 表单下方的错误 / 成功提示 */
.form-error,
.form-tip { font-size: 13px; line-height: 1.7; }

.form-error { color: #d64545; }
.form-tip { color: var(--text-2); }

/* .dark-theme 覆盖：亮色的红在深色卡片上偏暗，这里提亮一点 */
.dark-theme .form-error { color: #ff8080; }

/* 项目卡片里的操作区。复用文章卡片那套 .article-actions 样式 */
.project-card .article-actions { margin-top: 12px; }

/* ---------- 身份验证页 ---------- */
.auth-panel { max-width: 660px; }

.auth-intro { font-size: 13.5px; line-height: 1.9; color: var(--text-2); }

.auth-intro code,
.auth-notice code {
  font-family: Consolas, Monaco, monospace;
  font-size: 12.5px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 5px;
  color: var(--accent);
}

/* 当前登录态的键值列表 */
.auth-state {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 16px 0;
  padding: 16px 18px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.auth-state-row { display: flex; align-items: baseline; gap: 12px; }

.auth-state-label {
  flex-shrink: 0;
  width: 76px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-3);
}

.auth-state-value {
  font-size: 13px;
  color: var(--text-1);
  line-height: 1.7;
  word-break: break-all;
}

/* 被守卫拦截时的提示 */
.auth-notice {
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-2);
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 11px 14px;
  margin-bottom: 4px;
}

.auth-form { display: flex; flex-direction: column; gap: 12px; }

.auth-form-title { font-size: 13px; font-weight: 600; color: var(--text-2); }

/* 演示账号选择卡片 */
.account-choice { display: flex; flex-wrap: wrap; gap: 10px; }

.account-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 11px 18px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--bg-soft);
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.1s;
}

.account-card:active { transform: scale(0.98); }

.account-card.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.account-name { font-size: 13.5px; font-weight: 700; color: var(--text-1); }
.account-role { font-size: 11.5px; color: var(--text-3); }

.auth-actions { display: flex; flex-wrap: wrap; gap: 10px; }

.auth-tip { font-size: 12.5px; line-height: 1.8; color: var(--text-3); }

/* ---------- 导航栏的登录态 ---------- */
.nav-lock { font-size: 11px; opacity: 0.8; }

/* 已登录时显示的用户名胶囊 */
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--text-2);
  font-size: 12.5px;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}

.user-chip:hover { border-color: var(--accent); color: var(--accent); }

.user-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1f9d55;
  flex-shrink: 0;
}

.dark-theme .user-dot { background: #4ade80; }

.user-name { font-weight: 600; }

.user-signout {
  border: none;
  background: none;
  padding: 0 2px;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.2s;
}

.user-signout:hover { color: #d64545; }
.dark-theme .user-signout:hover { color: #ff8080; }

/* ========== 底部 ========== */
.site-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  padding: 12px 24px 14px;
  text-align: center;
  background: var(--bg-card);
  color: var(--text-3);
  font-size: 12px;
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.site-footer a { color: var(--accent); text-decoration: none; }
.site-footer a:hover { text-decoration: underline; }

.footer-nav-links {
  margin-top: 7px;
  display: flex;
  justify-content: center;
  gap: 18px;
}

/* ========== 404 页面 ========== */
/* 和其它页面一样用 .view-container + .panel，保证切换到 404 时布局不变形 */
.nf-panel {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 40px 22px;
}

.nf-code {
  font-size: 76px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 4px;
  /* 用渐变文字做「404」三个数字 */
  background: linear-gradient(135deg, var(--accent) 0%, #7a6bff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.nf-title { font-size: 18px; font-weight: 700; color: var(--text-1); margin-top: 6px; }

.nf-desc { font-size: 13.5px; color: var(--text-3); max-width: 420px; line-height: 1.8; }

/* code 标签显示用户刚访问的那个错误路径 */
.nf-path {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12.5px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 2px 7px;
  border-radius: 5px;
  word-break: break-all;
}

/* .nf-actions 的样式已在文章管理页那节和 .notice-actions 合并定义 */

/* ========== 响应式 ========== */
@media (max-width: 720px) {
  body { padding: 16px 10px; }

  #app {
    height: auto;
    min-height: calc(100vh - 32px);
    max-height: none;
    border-radius: 14px;
    flex-direction: column;
  }

  .site-header {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .header-inner { gap: 12px; padding: 14px 16px; }

  .header-nav { flex-direction: row; flex-wrap: wrap; gap: 6px; }
  .nav-btn { padding: 7px 11px; }
  .nav-btn.active::before { display: none; }

  .header-footer { flex-direction: row; padding-top: 10px; }
  .rail-link, .header-toggle { flex: 1; }

  .topbar { height: auto; padding: 12px 18px; flex-direction: column; align-items: flex-start; gap: 4px; }
  .topbar-date { display: none; }

  .main { padding: 16px; scrollbar-gutter: auto; }

  .profile-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }

  .article-detail-title { font-size: 19px; }
  .article-actions .btn { flex: 1; }
  .edit-actions { justify-content: stretch; }
  .edit-actions .btn { flex: 1; }
}
</style>
