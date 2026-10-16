# Vue 3 路由与页面（Router）学习教程 —— 路由配置 + 导航实现步骤 + 项目实时代码

> 适用对象：Vue 3 初学者（已学到"组件"和"插槽"章节，想搞懂 vue-router）
> 项目：`01-vue` 个人主页（Vue 3 + Vite + vue-router 4，Options API 的 App.vue + `<script setup>` 页面组件）
> 教程中的每一段代码都是从本项目里**原样复制**的"实时代码"，可以对照你本地文件查看。

---

## 目录

1. [核心思想：一句话记住路由](#一核心思想一句话记住路由)
2. [第 1 步：装上路由（main.js）](#第-1-步装上路由mainjs)
3. [第 2 步：写路由表（router/index.js）](#第-2-步写路由表routerindexjs)
4. [第 3 步：把出口从"手动切换"换成"路由出口"（App.vue）](#第-3-步把出口从手动切换换成路由出口appvue)
5. [第 4 步：导航从"发事件"换成"RouterLink"（AppHeader）](#第-4-步导航从发事件换成routerlinkappheader)
6. [第 5 步：404 页面（NotFoundView + 通配路由）](#第-5-步404-页面notfoundview--通配路由)
7. [第 6 步：跨页面共享数据（stores/profileStore.js）](#第-6-步跨页面共享数据storesprofilestorejs)
8. [最重要的知识点：路由化之后 props 失效了](#二最重要的知识点路由化之后-props-失效了)
9. [知识点清单（自测）](#三知识点清单自测)
10. [常见坑（新手必踩）](#四常见坑新手必踩)
11. [下一步练习建议](#五下一步练习建议)

---

## 一、核心思想：一句话记住路由

> **URL 变了 → 换哪个组件。路由就是"地址"和"页面"的对照表。**

没有路由时（本项目改造前的做法）：所有内容堆在一个页面里，用 `currentPage` 变量 + `v-if` 手动切换。

```html
<!-- ❌ 改造前的写法（本项目已删除，仅作对比） -->
<ProfileView v-if="currentPage === 'profile'" />
<SkillsView  v-else-if="currentPage === 'skills'" />
<ProjectsView v-else-if="currentPage === 'projects'" />
...
```

这套写法的问题：
- 地址栏永远是 `/`，**刷新就回到第一页**
- 浏览器**前进/后退键无效**
- 链接**不能分享、不能收藏**（发给同学打开的是首页，不是你想让他看的那页）

用了路由之后：

```
地址栏 /profile   →  路由表查到 profile  →  渲染 ProfileView.vue
地址栏 /projects  →  路由表查到 projects →  渲染 ProjectsView.vue
```

**你只需要改地址栏，Vue 自动帮你换页面。** 这就是路由。

### 三个核心概念

| 概念 | 是什么 | 本项目在哪 |
|---|---|---|
| `routes` 路由表 | `path ↔ component` 的对照表 | `src/router/index.js` |
| `<RouterLink>` | 相当于"换地址栏"的 `<a>` 标签 | `src/components/AppHeader.vue` |
| `<RouterView>` | "当前地址对应的组件"显示在这里的坑 | `src/App.vue` |

**和插槽类比一下**（如果你看了插槽那篇教程）：

```
插槽：      子组件挖 <slot> 坑   ←→  父组件填料
路由出口：  App.vue 挖 <RouterView> 坑  ←→  路由表根据 URL 填料
```

`<RouterView>` 本质上就是一个"超级插槽"，填料的不是父组件，而是路由表。

---

## 第 1 步：装上路由（main.js）

> 文件：`src/main.js`
> 知识点：`.use(router)` 注入路由实例

当前项目中的实时代码（完整文件）：

```js
/**
 * ============================================================
 * 【应用入口】src/main.js
 * ============================================================
 * .use(router) 的作用：把路由实例注入到 Vue 应用里。
 * 注入之后，全局才认识 <RouterLink> 和 <RouterView> 这两个组件，
 * 页面才能通过地址栏 URL 决定渲染谁。
 *
 * 顺序有讲究：必须在 createApp() 之后、mount() 之前。
 * mount() 才是真正把组件挂到 DOM 上，此时路由必须已经装好。
 *
 * 挂载点：index.html 里的 id="root"
 * ============================================================
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#root')
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `import router from './router'` | 把路由实例引进来 |
| `.use(router)` | **注入路由**，全局才认识 `<RouterLink>` / `<RouterView>` |
| `.mount('#root')` | 挂载到 `index.html` 里 `id="root"` 的节点 |

⚠️ **`mount()` 里是 `#root` 不是 `#app`。** 项目早期的文档写的是 `#app`，后来改成了 `#root`。以 `index.html` 里实际的 id 为准。

### ✅ 验证方法

把 `.use(router)` 删掉再刷新页面 → 控制台报错，且模板里的 `<RouterView>` 完全不渲染。说明这一步是整个路由的地基。

---

## 第 2 步：写路由表（router/index.js）

> 文件：`src/router/index.js`
> 知识点：路由表、**懒加载**、`meta`、`redirect`、路由模式

当前项目中的实时代码：

```js
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

const routes = [
  /* 首页重定向到个人信息页：访问 / 自动跳到 /profile */
  { path: '/', redirect: '/profile' },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    // meta 会被挂到 $route.meta 上，用来驱动顶栏标题（见 App.vue）
    meta: { title: '个人信息', sub: '查看你的基础档案与个人简介' },
  },
  {
    path: '/skills',
    name: 'skills',
    component: () => import('../views/SkillsView.vue'),
    meta: { title: '技能标签', sub: '检索与浏览你掌握的技能关键词' },
  },
  // ... ProjectsView / HobbiesView / EditView 同理
]
```

### 关键点 1：懒加载（`() => import(...)`）

```js
component: () => import('../views/ProfileView.vue')
//          ↑ 这个箭头函数是关键
```

**为什么要这么写？** 如果写成 `import ProfileView from '...'`，6 个页面会被**全部打包进第一个 JS 文件**，用户打开首页就要下载所有页面的代码，哪怕他只看个人信息。

用箭头函数 + 动态 `import()`，Vite 会把每个页面**拆成独立的 JS 文件**，访问哪个页面才下载哪个。`npm.cmd run build` 的输出可以直接看到效果：

```
dist/assets/ProfileView-q_STBRW0.js     2.38 kB
dist/assets/SkillsView-DU330uzO.js      1.54 kB
dist/assets/ProjectsView-CGTOEOnD.js    0.90 kB
dist/assets/HobbiesView---vBX53O.js     0.92 kB
dist/assets/EditView-CxUPkJTQ.js        2.53 kB
dist/assets/NotFoundView-CbR8E6L9.js    0.75 kB
dist/assets/index-DWVDxYms.js         104.75 kB   ← 只剩框架代码
```

⚠️ 别手贱改回静态 import，收益（首屏快一点）远小于代价（失去代码分割）。

### 关键点 2：`meta` —— 页面自己的"说明信息"

```js
meta: { title: '个人信息', sub: '查看你的基础档案与个人简介' }
```

`meta` 是路由的**附加数据**，运行时挂在 `$route.meta` 上。本项目用它驱动两处：

1. **顶栏标题**（`App.vue` 里）：`{{ $route.meta.title }}`
2. **浏览器标签标题**（`beforeEach` 守卫里）：`document.title = ...`

好处是**加页面不用改 App.vue**——路由表里写好 `meta`，顶栏自动就变了。

### 关键点 3：`redirect` —— 首页重定向

```js
{ path: '/', redirect: '/profile' }
```

用户访问 `/` 时自动转到 `/profile`。注意 `redirect` 后面**不是组件**，是另一个路径（也可以是函数）。

### 关键点 4：路由模式（History vs Hash）

| 模式 | 创建函数 | 地址栏 | 刷新 `/profile` 会怎样 |
|---|---|---|---|
| **History**（本项目） | `createWebHistory()` | `/profile` | 服务器必须回传 `index.html`，否则 404 |
| **Hash** | `createWebHashHistory()` | `/#/profile` | 服务器看到的是 `/`，永远不会 404 |

History 模式地址好看，代价是**必须配服务器规则**。本项目在 `vite.config.js` 里配了：

```js
/**
 * 【History 模式必需】开发服务器的 history 回退
 *
 * 路由用的是 createWebHistory，地址栏里是 /profile、/projects 这种真实路径。
 * 这时如果直接刷新 F5，浏览器会向服务器请求 /profile 这个文件，
 * 服务器找不到就会返回 404，页面根本进不去。
 *
 * historyApiFallback 的作用：
 * 任何没匹配到静态文件的路径，一律回退返回 index.html，
 * 让前端路由接管后续解析。
 *
 * 注意：这只解决开发环境。打包上线后（npm run build），
 * 静态服务器也要配同样的 rewrite 规则，
 * 否则线上直接访问 /profile 依然会 404。
 */
server: {
  historyApiFallback: true,
},
```

### ✅ 验证方法

启动 `npm.cmd run dev`，然后：
1. 点左侧导航 → 地址栏变成 `/skills`，刷新页面 → **还是技能页**（没路由时会回首页）
2. 地址栏手动敲 `http://localhost:5173/xxx` → 出现 404 页面（说明第 5 步生效了）
3. 点浏览器**后退** → 回到上一个页面（改造前这是无效的）

### 附加：路由守卫 `beforeEach`

路由表写完，可以挂一个**全局前置守卫**——每次跳转「之前」自动执行的函数。本项目用它同步浏览器标签标题（实时代码）：

```js
/**
 * 全局前置守卫：在每次跳转「之前」执行。
 *
 * beforeEach 的常用场景：
 *   - 登录校验：没登录就 next('/login')
 *   - 权限拦截：管理员页面做角色判断
 *   - 设置页面标题（这里用的就是它）
 *
 * 注意：next() 不传参数 = 放行。
 * 如果想在守卫里阻止跳转，就 return false 或者 return '/somewhere'。
 */
router.beforeEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} · 学生个人档案` : '学生个人档案'
})
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `router.beforeEach(fn)` | 注册全局前置守卫，`fn` 每次跳转前都会跑 |
| `to` | 即将跳到的那个路由对象（`to.meta` 就是目标路由的 meta） |
| `to.meta?.title` | 可选链 `?.`，meta 不存在时返回 undefined 而不是报错 |

作用效果：切到 `/skills` 时，浏览器标签页标题自动变成「技能标签 · 学生个人档案」。

---

## 第 3 步：把出口从"手动切换"换成"路由出口"（App.vue）

> 文件：`src/App.vue`
> 知识点：`<RouterView>`、`<Transition>` 配合、`<component :is>`

### 改造前（手动切换，本项目已删除，仅作对比）

```html
<main class="main">
  <Transition name="page" mode="out-in">
    <ProfileView v-if="currentPage === 'profile'" key="profile" :student="student" ... />
    <SkillsView v-else-if="currentPage === 'skills'" key="skills" ... />
    <ProjectsView v-else-if="currentPage === 'projects'" key="projects" ... />
    <HobbiesView v-else-if="currentPage === 'hobbies'" key="hobbies" ... />
    <EditView v-else-if="currentPage === 'edit'" key="edit" ... />
  </Transition>
</main>
```

### 改造后（路由出口，本项目实时代码）

```html
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
```

### 关键点 1：App.vue 里不再 import 任何页面组件

```js
// ❌ 现在 App.vue 里这些 import 全部删掉了
import ProfileView from './views/ProfileView.vue'
import SkillsView from './views/SkillsView.vue'
...

// ✅ 只剩布局相关的
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
```

**为什么？** 页面由路由表负责加载，App.vue 再 import 就等于把页面又拽回外壳里，路由的懒加载也会失效。

### 关键点 2：为什么 `<RouterView>` 必须带 `v-slot`

这是新手最容易懵的地方。

```html
<!-- ❌ 这样写，<Transition> 不会生效 -->
<RouterView>
  <Transition name="page"><component /></Transition>
</RouterView>

<!-- ✅ 正确：用作用域插槽取出组件再包 -->
<RouterView v-slot="{ Component }">
  <Transition name="page" mode="out-in">
    <component :is="Component" />
  </Transition>
</RouterView>
```

原因：`<RouterView>` 默认会**把 slot 内容当成普通插槽内容丢进路由组件里**，而不是把它当成"要渲染的组件"。必须用 `v-slot` 明确告诉它"我要拿到 `Component` 这个变量"。

### 关键点 3：`<component :is="Component" />` 是动态组件

这是 Vue 内置的动态组件语法，`Component` 是什么就渲染什么。

**"切换页面"的底层原理，其实就是动态组件。** `<RouterView>` 帮你从路由表查出该渲染哪个组件，然后交给 `<component :is>` 渲染出来。

### 关键点 4：`key` 换了个玩法

改造前手写切换时，每个组件上要写 `key="profile"` 来帮 Vue 区分。
改造后**不用写了** —— `<component :is="Component" />` 在组件类型变化时，Vue 会自动重新挂载，配合 `Transition` 就能正常播放动画。

### 关键点 5：顶栏标题改读 `$route.meta`

```html
<!-- 改造前：读本地 PAGE_META 映射表 -->
<h1 class="topbar-title">{{ pageMeta.title }}</h1>

<!-- 改造后：直接读当前路由的 meta（实时代码） -->
<h1 class="topbar-title">{{ $route.meta.title }}</h1>
<p class="topbar-sub">{{ $route.meta.sub }}</p>
```

`$route` 在 Options API 里不用 import，Vue 实例上直接有这个属性。

对应的 `PAGE_META` 常量和 `pageMeta` computed 全部删掉了——**标题的唯一数据源现在是路由表**。

### ✅ 验证方法

`npm.cmd run dev`，点左侧 5 个导航按钮 → 每次都能正确切换页面 + 淡入淡出动画正常播放，且 App.vue 里搜不到任何 `v-if="currentPage`。

---

## 第 4 步：导航从"发事件"换成 RouterLink（AppHeader）

> 文件：`src/components/AppHeader.vue`
> 知识点：`<RouterLink>`、`active-class` 自动高亮、`to` vs `href`

### 改造前（button + emit，本项目已删除，仅作对比）

```html
<nav class="header-nav">
  <button v-for="item in navItems" :key="item.key"
    :class="{ active: currentPage === item.key }"
    @click="emits('navigate', item.key)">
    {{ item.label }}
  </button>
</nav>
```

配套的 `App.vue` 里还要写 `navigate()` 方法手动改 `currentPage`——**父组件被牵扯进来了**。

### 改造后（RouterLink，本项目实时代码）

```html
<!-- 导航：RouterLink 自动高亮当前页 -->
<nav class="header-nav">
  <RouterLink
    v-for="item in navItems"
    :key="item.path"
    :to="item.path"
    class="nav-btn"
    active-class="active"
  >
    <span class="nav-icon">{{ item.icon }}</span>
    <span>{{ item.label }}</span>
  </RouterLink>
</nav>
```

配套的数据（实时代码）：

```js
/** 导航项配置：path 必须和 router/index.js 里的 path 对得上 */
const navItems = [
  { path: '/profile', label: '个人信息', icon: '👤' },
  { path: '/skills', label: '技能标签', icon: '🏷️' },
  { path: '/projects', label: '项目经历', icon: '📁' },
  { path: '/hobbies', label: '兴趣爱好', icon: '✨' },
  { path: '/edit', label: '编辑资料', icon: '✏️' },
]
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `<RouterLink>` | 全局注册的组件，**`<script setup>` 里不用 import** |
| `:to="item.path"` | 相当于 `<a href>`，点击后改地址栏 |
| `active-class="active"` | 当前路由匹配时**自动**给这个 `<a>` 加上 `active` 类名 |
| 删掉 `:currentPage="currentPage"` | 高亮不用自己判断了 |
| 删掉 `@click="emits('navigate', ...)"` | 跳转不用发事件了，**AppHeader 不再需要 `navigate` emit** |

### 对照表：`<a>` → `<RouterLink>`

| 普通 `<a>` | `<RouterLink>` | 说明 |
|---|---|---|
| `href="/profile"` | `to="/profile"` | 目标地址 |
| 无 | `active-class="active"` | 当前页自动高亮 |
| 刷新就 404 | 拦截点击，不刷新页面 | 体验好、不丢状态 |
| `<a href>` 触发浏览器导航 | 触发路由跳转 | 不会整页刷新 |

### 一个容易忘的细节：`text-decoration`

`<RouterLink>` 渲染出来是 `<a>` 标签，**浏览器默认给它加下划线**。本项目在 `App.vue` 的全局 CSS 里补了：

```css
/* <RouterLink> 渲染出来是 <a>，默认带下划线，这里去掉。
   .brand 和 .nav-btn 同样要处理，因为它们也换成了 RouterLink。 */
.brand,
.nav-btn,
.footer-nav-links a { text-decoration: none; }
```

### 顺手一提：插槽没被路由「吃掉」

`AppHeader` 里那个 `#nav-extra` 具名插槽**照旧保留**（路由化和插槽是两套互不干扰的机制）：

```html
<!-- AppHeader.vue 底部：命名插槽 + 主题切换 -->
<div class="header-footer">
  <slot name="nav-extra"></slot>
  <button class="header-toggle" @click="emits('toggle-theme')">
    {{ isDark ? '☀️ 亮色模式' : '🌙 暗色模式' }}
  </button>
</div>
```

App.vue 那边照旧填料（`<template #nav-extra>` 注入 GitHub 链接）。插槽的详细讲解见另一篇《Vue3组件插槽Slot学习教程》。

### ✅ 验证方法

1. 点导航 → 地址栏变了，页面切换，且当前按钮有高亮底色
2. 点完之后按浏览器**后退** → 回到上一个页面，按钮高亮跟着变
3. 刷新 → 停留在当前页面（改造前做不到）

---

## 第 5 步：404 页面（NotFoundView + 通配路由）

> 文件：`src/views/NotFoundView.vue` + `src/router/index.js`
> 知识点：通配路由、`:pathMatch(.*)*`、`$route.fullPath`、编程式跳转

### 步骤 1：路由表最后加一条兜底规则（实时代码）

```js
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
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `:pathMatch(.*)*` | 通配语法，`.*` 匹配任意字符，`(.*)*` 允许匹配空 |
| 放在**最后** | 路由表是**从上到下依次匹配**的。放前面的话它会把所有路径都吃掉 |
| `name: 'not-found'` | 命名后可以用 `router.push({ name: 'not-found' })` 跳转 |

⚠️ **这是新手最常见的错误之一**：通配路由放到数组前面 → 所有页面都变 404。**记住：兜底的永远放最后。**

### 步骤 2：写 404 页面（实时代码）

```html
<!-- src/views/NotFoundView.vue -->
<template>
  <div class="view-container">
    <div class="panel nf-panel">
      <p class="nf-code">404</p>
      <h2 class="nf-title">页面走丢了</h2>
      <p class="nf-desc">
        你访问的地址 <code class="nf-path">{{ $route.fullPath }}</code> 不存在，
        可能已被移动或删除。
      </p>

      <div class="nf-actions">
        <button class="btn btn-primary" @click="goHome">返回首页</button>
        <!-- go 传 -1 表示「后退一步」，回到跳转过来的那个页面 -->
        <button class="btn btn-secondary" @click="router.go(-1)">返回上一页</button>
      </div>
    </div>
  </div>
</template>
```

```js
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

/** 返回首页：用 replace 而不是 push，避免 404 留在历史栈里 */
function goHome() {
  router.replace('/profile')
}
</script>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `{{ $route.fullPath }}` | 拿到用户刚才敲错的完整路径，显示出来方便排查 |
| `useRouter()` | 在 `<script setup>` 里拿路由实例（必须 import） |
| `router.replace('/profile')` | 跳转但**不留历史记录** |
| `router.go(-1)` | 后退一步，等价于浏览器后退键 |

### 关键点：`push` vs `replace`

| 方法 | 历史栈 | 什么时候用 |
|---|---|---|
| `router.push()` | **加一条** | 用户主动切换页面（点导航）→ 浏览器后退能回去 |
| `router.replace()` | **替换当前那条** | 「保存成功后跳走」「404 返回首页」→ 不该能退回去 |
| `router.go(-1)` | 后退 | "返回上一页"按钮 |
| `router.go(0)` | 刷新 | 等同 `location.reload()` |

**404 页面必须用 `replace`**：否则用户点了"返回首页"之后再按后退，会**又回到 404**，体验很怪。

### 关键点：结构要和其他页面一样

404 页面外层依然是 `.view-container` + 内部 `.panel`。**不能随便写个居中 div**，否则切到 404 时整个布局会变形（左右栏、高度全变）。对应的 404 样式也写在 `App.vue` 全局 CSS 里：

```css
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
```

### ✅ 验证方法

地址栏手动敲 `http://localhost:5173/abc` → 出现 404 页面，页面上显示你敲的 `/abc`。点"返回首页" → 到个人信息页，**再按浏览器后退 → 不会回到 404**（因为用了 `replace`）。

---

## 第 6 步：跨页面共享数据（stores/profileStore.js）

> 文件：`src/stores/profileStore.js`
> 知识点：为什么路由化之后 props 失效了、`reactive` 做轻量全局 store

> ⚠️ **本节已被 Pinia 取代。** 下面讲的是当时用 `reactive({...})` 手写 store 的做法，
> 代码仍可阅读（它解释了「为什么需要 store」这个前提），但**项目当前用的是 Pinia**：
> 实际文件是 `src/stores/profileStore.js`，写法是 `defineStore('profile', () => {...})`。
> 详见 `src/stores/profileStore.js` 文件头注释。

**这一步不是路由本身的知识，但它是被路由逼出来的必做项。** 没做这一步，项目根本跑不起来。

### 问题：App.vue 的 props 传不进页面组件了

改造前，`App.vue` 用 `data()` 存数据，再 props 传给每个页面：

```html
<!-- 改造前：可行 -->
<ProfileView :student="student" :skills="skills" :intro="intro" />
```

改造后，`App.vue` 里只有一句：

```html
<RouterView v-slot="{ Component }">
  <Transition name="page" mode="out-in">
    <component :is="Component" />
  </Transition>
</RouterView>
```

**问题就在这：`<RouterView>` 和路由组件之间没有任何东西，App.vue 根本没法往里塞 props。** `<component :is="Component" />` 是完全动态的，Vue 不知道你要传什么。

### 解决方案：数据提到模块里，各页面自己 import

```js
// src/stores/profileStore.js —— 历史写法（已迁到 Pinia）
import { reactive } from 'vue'

export const profileStore = reactive({
  /* ---------- 基本信息 ---------- */
  student: {
    name: 'liuxue',
    major: '计算机科学与技术',
  },

  students: [
    { label: '学号', value: '24*******' },
    { label: '性别', value: '男' },
    { label: '邮箱', value: '*********@qq.com' },
    { label: '电话', value: '181-****-****' },
  ],

  avatarUrl: '',

  /* ---------- 个人简介 ---------- */
  intro: '热爱编程与技术探索，熟悉前端基础（HTML / CSS / JavaScript）与 Vue 框架，...',

  /* ---------- 技能 ---------- */
  skills: ['HTML', 'CSS', 'JavaScript', 'Vue', 'Vite', 'Pinia', 'Axios', 'Git'],

  /* ---------- 项目 ---------- */
  projects: [
    { name: '校园二手交易平台', time: '2024.09 - 2024.12', desc: '...' },
    { name: '个人技术博客', time: '2024.05 - 2024.08', desc: '...' },
  ],

  /* ---------- 爱好 ---------- */
  hobbies: ['🏀 篮球', '📷 摄影', '📚 阅读', '💻 编程'],

  /* ---------- 交互状态 ---------- */
  detailsExpanded: true,
})

/**
 * 头像是用姓名字首生成的 SVG，转成 data URL 直接塞给 <img src>
 */
export function generateAvatarDataUrl(name) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const svg = `<svg ...>${initial}</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
```

页面里直接用（`ProfileView.vue` 实时代码）：

```html
<script setup>
import { computed } from 'vue'
import ProfileSidebar from '../components/ProfileSidebar.vue'
import IntroSection from '../components/IntroSection.vue'
import { profileStore } from '../stores/profileStore'

/** 直接引用全局 store，不需要 props */
const store = profileStore

/** 身份卡上那三个统计数字 */
const counts = computed(() => ({
  skills: store.skills.length,
  projects: store.projects.length,
  hobbies: store.hobbies.length,
}))
</script>

<template>
  <div class="view-container profile-grid">
    <ProfileSidebar
      :student="store.student"
      :students="store.students"
      :avatarUrl="store.avatarUrl"
      :counts="counts"
    />

    <IntroSection
      :intro="store.intro"
      :detailsExpanded="store.detailsExpanded"
      @toggle-details="store.detailsExpanded = !store.detailsExpanded"
    />
  </div>
</template>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `reactive({...})` | 把一个普通对象变成响应式（全局唯一数据源） |
| `export const profileStore` | 导出这个对象，任何页面都能 import 到**同一份** |
| `const store = profileStore` | 起个短别名，模板里写 `store.xxx` 比 `profileStore.xxx` 顺手 |
| `store.detailsExpanded = !store.detailsExpanded` | 直接改 store，其它页面自动跟着更新 |

### 为什么用 `reactive` 而不是 `ref`

| | `ref(值)` | `reactive(对象)` |
|---|---|---|
| 适合 | 单个值：字符串、数字、布尔 | 一堆字段组成的一个对象 |
| 访问 | `.value`（模板里自动解包） | 直接 `.xxx` |
| 整体替换 | `x.value = 新值` ✅ | 不行（会丢失响应式） |

本项目的数据是"一组字段"，用 `reactive` 更合适。

### ✅ 验证方法

进 `/edit` 页面 → 把姓名改成"张三" → 保存 → 自动跳回 `/profile` → **头像和姓名都已经变成张三了**。这就是单一数据源的效果。

---

## 二、最重要的知识点：路由化之后 props 失效了

> 上一节已经讲过了，这里把**判断规则**整理成表，务必吃透。

**`App.vue` 能做的事，在路由化之后大幅缩水了：**

| 能力 | 改造前 | 改造后 | 原因 |
|---|---|---|---|
| 给页面传 props | ✅ `<ProfileView :student="student" />` | ❌ 做不到了 | `<component :is>` 是动态的，Vue 不知道你要传什么 |
| 监听页面事件 | ✅ `@save-edit="handleSaveEdit"` | ❌ 做不到了 | 同上，`v-on` 挂不上去 |
| 决定显示哪个页面 | ✅ `v-if="currentPage==='x'"` | ❌ 交给路由表 | 路由表的职责 |
| 改页面标题 | ✅ `pageMeta` computed | ✅ 改成读 `$route.meta` | `$route` 在模板里直接可用 |
| 全局样式 | ✅ 全局 `<style>` | ✅ 不变 | 和路由无关 |

**所以：业务数据必须搬走。** 这就是 store 存在的原因。

### 两种方案的取舍

| 方案 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| 手写 `reactive` 模块 | `import { profileStore }` | 零依赖、代码直观、5 行搞定 | 项目大了会散落各处 import；没有 devtools；容易误用（顶层调用、到处 `import` 同一份单例） |
| **本项目做法**：Pinia | `defineStore('profile', () => {...})` | 官方方案、devtools 友好、适合大项目、`storeToRefs` 可选 | 要多装一个依赖、多学一套 API |

**项目当前已经迁到 Pinia 了**（本节最初写的是「先用 `reactive` 跑通，等项目大了再换」——现在就是那个「大了」的时刻）。迁移真正花的功夫不在 import 那一行，而在三处容易翻车的地方：

1. `main.js` 必须 `createApp(App).use(pinia).use(router).mount('#root')`，漏了 `.use(pinia)` **不会构建报错**，只会在运行时白屏。
2. `useXxxStore()` 必须在 `setup()` 里调用，不能在模块顶层。
3. store 内部不能用 `this`：setup store 的第二个参数是普通函数，`this` 不指向 store，要直接 `articles.value.find(...)`。

### 记忆口诀

> **能 props 传的，靠父；不能 props 传的，进 store。**

---

## 三、知识点清单（自测）

- [ ] ① 路由表 = `path ↔ component` 的对照表，写在 `src/router/index.js`
- [ ] ② `createApp(App).use(router).mount('#root')`——`.use()` 必须在 `.mount()` 之前
- [ ] ③ `<RouterView>` 是路由出口；`<RouterLink>` 是"换地址"的链接
- [ ] ④ `<RouterView>` **默认写法和 `<Transition>` 不兼容**，必须用 `v-slot="{ Component }"`
- [ ] ⑤ `<component :is="Component" />` = 动态组件，这就是"切换页面"的底层原理
- [ ] ⑥ `component: () => import('...')` = 懒加载，**不要改回静态 import**
- [ ] ⑦ `meta` 挂在 `$route.meta` 上，用来存页面标题等附加信息
- [ ] ⑧ `redirect` 用于路径重定向（`/` → `/profile`）
- [ ] ⑨ 通配路由 `/:pathMatch(.*)*` **必须放数组最后**，否则吃掉所有路径
- [ ] ⑩ `<RouterLink active-class="active">` 自动高亮当前页，不用自己判断
- [ ] ⑪ `to="/x"` 相当于 `href`，但不会整页刷新
- [ ] ⑫ `<RouterLink>` 渲染成 `<a>`，**记得去掉 `text-decoration`**
- [ ] ⑬ 编程式跳转：`useRouter()` → `push`（留历史）/ `replace`（不留）/ `go(-1)`（后退）
- [ ] ⑭ Options API 里不用 import，`this.$route` / `this.$router` 直接可用
- [ ] ⑮ `beforeEach` 守卫做全局前置逻辑（如设置 `document.title`）
- [ ] ⑯ **History 模式必须配服务器回退**，开发靠 `historyApiFallback`，生产靠服务器 rewrite
- [ ] ⑰ 路由化后 **props 传不进页面组件了**，业务数据必须提到 store
- [ ] ⑱ 404 页面的结构要和其他页面一致（`.view-container` + `.panel`），否则布局变形

---

## 四、常见坑（新手必踩）

1. **通配路由放前面**
   → 所有页面都变 404。**兜底规则永远放最后。**

2. **`<RouterView>` 没带 `v-slot` 就想加过渡动画**
   → 动画不生效。必须 `<RouterView v-slot="{ Component }">` 把组件取出来。

3. **刷新页面 404（History 模式）**
   → 开发环境：`vite.config.js` 加 `server.historyApiFallback: true`
   → 生产环境：服务器配 rewrite 规则；或者改用 `createWebHashHistory()`

4. **改了路由表但页面没反应**
   → 检查 `path` 拼写；检查 `RouterLink` 的 `to` 和 `path` 是否**完全一致**（`/skill` vs `/skills` 这种错最容易犯）。

5. **`.use(router)` 写漏了**
   → `<RouterView>` / `<RouterLink>` 完全不渲染，控制台报 "Failed to resolve component"。

6. **路由组件写成静态 import**
   → 失去代码分割，六个页面全进主包。`npm.cmd run build` 看输出里有没有 `XxxView-xxx.js` 独立文件来验证。

7. **还在用 `$route.params` 拿一个根本没定义的参数**
   → 本项目用的是 `meta`（静态附加信息）。`params` 是路径变量（`/user/:id` 里的 `id`），别混。

8. **以为改 store 数据页面会立刻变**
   → 会变，但前提是**改的是 `reactive` 对象的属性**。如果整个对象被重新赋值（`profileStore = {...}`），响应式会丢。

9. **404 页面用 `push` 而不是 `replace`**
   → 用户点"返回首页"后再按后退，**又回到 404**，体验很怪。

10. **新建页面忘了改 AppHeader 的 `navItems`**
    → 路由能访问到（直接敲地址栏），但导航栏里没有入口。**加页面 = 路由表 + navItems 两处都要改。**

11. **给 `<RouterLink>` 加了 `href`**
    → `RouterLink` 用的是 `to`。写 `href` 会被当成普通属性渲染出一个无效属性。

12. **生产环境部署后子路由刷新 404**
    → 和坑 3 同源。静态服务器（Nginx / 阿里云 OSS）必须配 `try_files $uri $uri/ /index.html`。

---

## 五、下一步练习建议

1. **加一个新页面「学习计划」**
   - 建 `src/views/PlanView.vue`（随便写点内容）
   - 路由表加一条 `/plan`（记得**放在通配路由前面**）
   - `AppHeader` 的 `navItems` 加一项
   - 观察：顶栏标题自动变了（因为 `meta` 生效），**App.vue 一行都不用改**

2. **把 `/plan` 设成首页**
   - 把 `{ path: '/', redirect: '/profile' }` 改成 `redirect: '/plan'`

3. **给每个页面加「返回顶部」按钮**
   - 用 `router.push('/profile')`，体会 `push` 和 `replace` 的区别（按浏览器后退看效果）

4. **故意把通配路由挪到数组最前面**
   - 观察所有页面变 404 → 再挪回去。**这个错误亲手犯一次就记住了。**

5. **试试用动态路由参数**
   - 加一条 `/projects/:id`，项目列表里每项用 `<RouterLink :to="`/projects/${index}`">`
   - 在页面里用 `$route.params.id` 取值 → 观察同一个组件渲染不同数据

6. **给 404 页面加张插图 / 加几个"你可能想去"的链接**
   - 链接直接用 `<RouterLink to="/skills">`

7. ~~**挑战题：把 `profileStore` 换成 Pinia**~~ ✅ **已完成**
   - `npm.cmd i pinia`，`createPinia()` 注入，每页改一行 import
   - 体会为什么官方推荐大项目用 Pinia
   - 实际答案见 `src/stores/profileStore.js` 与 `src/stores/articleStore.js`

---

## 附：本轮涉及文件清单

| 文件 | 新增/改动 | 作用 |
|---|---|---|
| `src/router/index.js` | **新增** | 路由表：6 条页面路由 + 1 条 redirect + 1 条 404 通配；懒加载；`meta`；`beforeEach` |
| `src/stores/profileStore.js` | **新增** | 全局状态仓库（Pinia store），把业务数据从 App.vue 搬出来 |
| `src/views/NotFoundView.vue` | **新增** | 404 页面 |
| `src/views/ProfileView.vue` | 改动 | 改用 `useProfileStore()`，不再接 props |
| `src/views/SkillsView.vue` | 改动 | 同上；`keyword` 改为页面内部 `ref` |
| `src/views/ProjectsView.vue` | 改动 | 改用 store |
| `src/views/HobbiesView.vue` | 改动 | 改用 store |
| `src/views/EditView.vue` | 改动 | 改用 store + `router.replace('/profile')` |
| `src/App.vue` | 改动 | `v-if` 链 → `<RouterView>`；删 `currentPage`/`navigate`/`PAGE_META`/全部业务数据；顶栏改读 `$route.meta`；新增 404 样式 |
| `src/components/AppHeader.vue` | 改动 | `<button>` → `<RouterLink active-class="active">`；删 `currentPage` prop 和 `navigate` emit |
| `src/main.js` | 改动 | 加 `.use(router)` |
| `vite.config.js` | 改动 | 加 `server.historyApiFallback: true` |
| `AGENTS.md` | 改动 | 更新架构文档 |

---

*本教程代码与项目当前状态一致，`npm.cmd run build` 验证通过（44 模块，6 个页面各自独立打包）。*