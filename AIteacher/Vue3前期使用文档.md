# Vue 3 知识点复习手册 —— 从本项目源码全量提取

> 项目：`01-vue` 个人主页（Vue 3 + Vite）
> 用途：把**本项目里真实用到**的 Vue 知识点全部提取出来，每一条都配"项目实时代码"。
> 复习方式：先看概念一句话，再看项目代码印证，最后用文末自查清单检验。
> 全文代码与项目当前状态一致（`npm.cmd run build` 已验证通过）。

---

## 目录

- [0. 文件 → 知识点 速查地图](#0-文件--知识点-速查地图)
- [一、应用启动：入口与单文件组件](#一应用启动入口与单文件组件)
- [二、模板语法与指令](#二模板语法与指令)
- [三、组件系统：props / emits / v-model / defineModel](#三组件系统props--emits--v-model--definemodel)
- [四、插槽三兄弟](#四插槽三兄弟)
- [五、响应式 API：data / ref / reactive / computed](#五响应式-apidata--ref--reactive--computed)
- [六、侦听器 watch（两种写法）](#六侦听器-watch两种写法)
- [七、生命周期钩子](#七生命周期钩子)
- [八、样式与主题切换（Vue 参与的 CSS 机制）](#八样式与主题切换vue-参与的-css-机制)
- [九、配合 Vue 的常用 JS 技巧与 Web API](#九配合-vue-的常用-js-技巧与-web-api)
- [十、工程化要点](#十工程化要点)
- [十一、项目里的"坑"与约定备忘](#十一项目里的坑与约定备忘)
- [十二、自查清单（想复习 X → 去哪个文件看）](#十二自查清单想复习-x--去哪个文件看)

---

## 0. 文件 → 知识点 速查地图

| 文件 | 主要知识点 |
|---|---|
| `src/main.js` | `createApp().mount()`、ES Module import |
| `index.html` | SPA 根节点 `<div id="app">`、`type="module"` 入口 |
| `src/App.vue` | **选项式 API**：`data / methods / watch / mounted`、props 下发、事件监听、插槽填料、全局 CSS |
| `AppHeader.vue` | `defineProps`、`defineEmits`、**具名插槽** `#nav-extra` |
| `HeroSection.vue` | `defineProps`（4 个）、模板插值 `{{ }}`、`.length` 使用 |
| `ProfileSidebar.vue` | `defineProps`、属性绑定 `:src`、`v-for` 列表渲染 |
| `IntroSection.vue` | `defineProps`、`defineEmits`、动态 class `:class="{ collapsed }"`、三元表达式 |
| `SkillsSection.vue` | `defineModel`、`ref`、`computed`、`watch`、**作用域插槽**、`@keyup.enter`、`v-if/v-else` |
| `ProjectsSection.vue` | `defineProps`、`v-for` 渲染对象数组 |
| `HobbiesSection.vue` | `defineProps`、`v-for` 渲染字符串数组 |
| `EditSection.vue` | `reactive`、`watch(getter)`、多事件 emit（带 payload）、表单校验 |
| `AppFooter.vue` | `computed`、可选链 `?.`、**默认插槽 + 后备内容**、模板字符串 |

---

## 一、应用启动：入口与单文件组件

### 1.1 createApp().mount() —— 创建并挂载应用

`src/main.js`（完整实时代码）：

```js
// import './assets/main.css'   ← 被注释掉：项目不用这个 CSS 文件

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

知识点：
- `createApp(App)` 创建 Vue 应用实例（Vue 3 与 Vue 2 的 `new Vue()` 不同）。
- `.mount('#app')` 把应用挂载到 `index.html` 里 `id="app"` 的 DOM 节点上。

`index.html` 对应部分：

```html
<body>
  <div id="app"></div>                       <!-- Vue 挂载点 -->
  <script type="module" src="/src/main.js"></script>  <!-- ES Module 入口 -->
</body>
```

### 1.2 单文件组件（SFC）三块结构

每个 `.vue` 文件都是 SFC，由三块组成：

```vue
<template> ... </template>   <!-- ① 模板：写 HTML + Vue 指令 -->
<script> ... </script>       <!-- ② 逻辑：数据、方法、生命周期 -->
<style> ... </style>         <!-- ③ 样式：全局 或 scoped -->
```

本项目 **App.vue 用的是选项式 `<script>`**（`export default { ... }`），**全部 9 个子组件用的是 `<script setup>`**（组合式简化写法）—— 这是刻意安排的混合教学。

### 1.3 选项式 API vs 组合式 API（`<script setup>`）对照

| 用途 | App.vue（选项式） | 子组件（`<script setup>`） |
|---|---|---|
| 数据 | `data() { return { ... } }` | `ref()` / `reactive()` / `defineModel()` |
| 方法 | `methods: { fn() {} }` | 顶层 `function fn() {}` |
| 侦听 | `watch: { xxx() {} }` | `watch(xxx, cb)` |
| 挂载后 | `mounted() {}` | 需要时 `onMounted(() => {})`（本项目子组件未用） |
| 收 props | `props: ['xxx']` | `defineProps({ ... })`（无需 import） |
| 发事件 | `this.$emit('xx')` | `defineEmits(['xx'])` + `emits('xx')` |

> 一句话：`<script setup>` 让组件逻辑像"普通 JavaScript 函数"一样写，顶层声明的变量自动暴露给模板，不需要 `return`。

---

## 二、模板语法与指令

### 2.1 插值 `{{ }}`（Mustache）

`HeroSection.vue`：

```html
<h2 class="hero-name">{{ student.name }}</h2>
<span class="hero-num">{{ skills.length }}</span>
```

- 双大括号里的可以是：变量、属性访问（`student.name`）、表达式（`skills.length`）、方法调用、三元表达式。

`IntroSection.vue` 的三元表达式示例：

```html
{{ detailsExpanded ? '收起 ▲' : '展开 ▼' }}
```

### 2.2 属性绑定 `v-bind` 与简写 `:`

`ProfileSidebar.vue`：

```html
<img class="avatar" :src="avatarUrl" alt="头像" />
```

`AppFooter.vue`（动态 href + 模板字符串）：

```html
<a v-if="email" :href="`mailto:${email}`">{{ email }}</a>
```

> `:href` 是 `v-bind:href` 的简写。符号 `:` 表示"后面的值当表达式算"，不是当字符串。

### 2.3 动态 class 绑定（`:class` + 对象语法）

`IntroSection.vue`：

```html
<div class="details-collapse" :class="{ collapsed: !detailsExpanded }">
```

- 对象语法：`{ 类名: 布尔值 }`，布尔为真才加上该类。这里是"展开/收起"动画的核心。

### 2.4 事件绑定 `v-on` 与简写 `@`、修饰符

`IntroSection.vue`：

```html
<button class="btn-link" @click="toggleDetails">...</button>
```

`SkillsSection.vue`（回车键修饰符）：

```html
<input v-model="keyword" @keyup.enter="applySkillFilter" />
```

`App.vue`（父组件监听子组件事件，带参数）:

```html
<EditSection ... @save-edit="handleSaveEdit" ...></EditSection>
```

> `@click` 是 `v-on:click` 简写。常用修饰符：`.enter`（键盘）、`.prevent`（阻止默认）、`.stop`（阻止冒泡）。

### 2.5 v-if / v-else / v-show

`SkillsSection.vue`（v-if / v-else 兄弟指令）：

```html
<div class="tags" v-if="filteredSkills.length > 0"> ... </div>
<p class="empty-hint" v-else>没有匹配的技能，试试其他关键词吧。</p>
```

`SkillsSection.vue` 的插槽按钮（父组件里）+ `EditSection.vue`（v-show）：

```html
<button class="clear-btn" @click="clear" v-show="keyword">清空</button>   <!-- App.vue -->
<div v-show="editMode" class="edit-form"> ... </div>                     <!-- EditSection -->
```

| | `v-if` | `v-show` |
|---|---|---|
| 原理 | 真渲染/销毁 DOM | 一直渲染，只切 `display: none` |
| 场景 | 大概率不显示、初始化开销大 | 频繁切换（表单、按钮） |
| 注意 | 必须紧跟 `v-else` | 无兄弟约束 |

### 2.6 v-for 列表渲染 + :key

`ProfileSidebar.vue`：

```html
<li v-for="(item, i) in students" :key="i">
  <span class="label">{{ item.label }}</span>
  <span class="value">{{ item.value }}</span>
</li>
```

`ProjectsSection.vue`（遍历对象数组）：

```html
<div class="project" v-for="(proj, i) in projects" :key="i">
  <div class="project-name">{{ proj.name }}</div>
  <div class="project-time">{{ proj.time }}</div>
</div>
```

`HobbiesSection.vue`（遍历字符串数组）：

```html
<div class="hobby-card" v-for="(hobby, i) in hobbies" :key="i">{{ hobby }}</div>
```

> **`:key` 必须写**：帮助 Vue 复用/区分列表项；key 变化时强制重新渲染该项（这里用 index，简单练习可以；生产列表建议用稳定 id）。

### 2.7 v-model 双向绑定（表单）

`EditSection.vue`（input / textarea 都支持）：

```html
<input id="editName" type="text" v-model="editForm.name" placeholder="请输入姓名" />
<textarea id="editIntro" rows="3" v-model="editForm.intro"></textarea>
<input id="editSkills" type="text" v-model="editForm.skillsText" ... />
```

`SkillsSection.vue`（输入框实时过滤）：

```html
<input type="text" v-model="keyword" placeholder="输入关键词筛选技能..." />
```

> 原理：`v-model` 是 `:value` + `@input` 的语法糖。用在表单控件上自动区分 type；用在**组件上**则需要 props + emit 配合（见下节）。

---

## 三、组件系统：props / emits / v-model / defineModel

### 3.1 组件注册与使用

`App.vue`（选项式注册）：

```js
import SkillsSection from './components/SkillsSection.vue'
export default {
  components: { SkillsSection, /* ... 共 9 个 */ },
}
```

模板中使用 + 传 props + 监听事件（一个最完整的父传子例子）：

```html
<EditSection :editMode="editMode" :student="student" :intro="intro" :skills="skills"
  @toggle-edit="toggleEdit" @save-edit="handleSaveEdit" @cancel-edit="cancelEdit"></EditSection>
```

### 3.2 props：父 → 子 单向数据流

子组件声明（`HeroSection.vue`，带类型和必填校验）：

```js
const props = defineProps({
  student: { type: Object, required: true },
  skills:  { type: Array,  required: true },
  projects:{ type: Array,  required: true },
  hobbies: { type: Array,  required: true },
})
```

带默认值（`ProfileSidebar.vue` / `IntroSection.vue`）：

```js
avatarUrl: { type: String, default: '' },
detailsExpanded: { type: Boolean, default: true },
```

**单向数据流铁律**：子组件**不能改 props**。要改就向上 emit，由父组件改。（项目里 EditSection 把 props 复制进自己 `reactive` 表单再改，就是正确姿势。）

### 3.3 emits：子 → 父 事件（可带 payload）

`IntroSection.vue`（声明 + 触发）：

```js
const emits = defineEmits(['toggle-details'])
function toggleDetails() {
  emits('toggle-details')   // ← 真实函数调用！项目曾出现过 emits: ('x') 标签语句 bug
}
```

`EditSection.vue`（带 payload + 多事件）：

```js
const emits = defineEmits(['toggle-edit', 'save-edit', 'cancel-edit', 'clear-skill-filter'])

emits('save-edit', {
  name: editForm.name.trim(),
  major: editForm.major.trim() || '未填写',
  intro: editForm.intro.trim() || '这个人很懒，什么都没写。',
  skills: [...new Set(newSkills)],
})
```

父组件接收（`App.vue`）：

```js
handleSaveEdit(payload) {
  this.student.name = payload.name
  this.skills = payload.skills
  this.editMode = false
}
```

### 3.4 v-model 用在组件上：v-model:xxx + defineModel

`SkillsSection.vue`（子组件）：

```js
const keyword = defineModel('keyword', { type: String, default: '' })
// 输入框直接绑 defineModel 的 ref
<input type="text" v-model="keyword" ... />
```

`App.vue`（父组件）：

```html
<SkillsSection v-model:keyword="skillKeyword" :skills="skills"> ... </SkillsSection>
```

配套：父组件 `data()` 里必须有 `skillKeyword: ''`。

知识点：
- `v-model:keyword="xxx"` = 传 prop `keyword` + 监听 `update:keyword` 的语法糖。
- `defineModel('keyword')` 在子组件里"代理"这个绑定，赋值 `keyword.value = ''` 会自动通知父组件。
- `defineModel()` 无参默认是 `modelValue`；有参（如 `'keyword'`）就是自定义名。
- 这是 Vue 3.4+ 的语法糖，作用等同"props + emits"手写，但代码更少。

---

## 四、插槽三兄弟

### 4.1 默认插槽 + 后备内容（AppFooter）

子组件（`AppFooter.vue`）：

```html
<slot>
  <p class="footer-contact"> 邮箱 / 电话 … </p>   <!-- 后备内容，父不填时显示 -->
</slot>
```

父组件填料（`App.vue`）：

```html
<AppFooter :student="student" :students="students">
  <div class="footer-nav-links">
    <a href="#top">首页</a>
    <a href="#projects">项目经历</a>
    <a href="mailto:428608535@qq.com">联系我</a>
  </div>
</AppFooter>
```

> 后果：父组件写了内容 → 后备内容整个被替换。

### 4.2 具名插槽（AppHeader）

子组件（`AppHeader.vue`）：

```html
<slot name="nav-extra"></slot>   <!-- 贴了名字的坑 -->
```

父组件指名填料（`App.vue`）：

```html
<AppHeader :name="student.name" :isDark="isDark" @toggle-theme="toggleTheme">
  <template #nav-extra>
    <a class="header-extra-link" href="https://github.com/" ...>GitHub</a>
  </template>
</AppHeader>
```

> `#nav-extra` 是 `v-slot:nav-extra` 简写。不带 `#` 的内容一律进默认插槽。具名插槽不填 = 什么都不渲染（可选区域）。

### 4.3 作用域插槽（SkillsSection）—— 子把数据递给父的插槽内容

子组件（`SkillsSection.vue`）：

```html
<slot :keyword="keyword" :clear="clearSkillFilter"></slot>
<!-- ↑ 打包递出：实时关键字 + 清空函数 -->
```

父组件（`App.vue`）：

```html
<template #default="{ keyword, clear }">
  <button class="clear-btn" @click="clear" v-show="keyword">清空</button>
</template>
```

知识点：
- 插槽内容编译在**父组件作用域**，子组件内部变量（如 `keyword`、`clearSkillFilter`）父组件**直接访问不到**——必须由子组件通过 `<slot :名字="值">` 递出来，父组件在 `#default="{ 名字 }"` 解构接收。
- 记忆口诀：**父能用父的；子要递出来才能用。**

> 三兄弟小结：默认插槽（无名）、具名插槽（`name` + `#`）、作用域插槽（递数据出去）。

---

## 五、响应式 API：data / ref / reactive / computed

### 5.1 选项式 data()（App.vue）

```js
data() {
  return {
    skillKeyword: '',
    student: { name: 'liuxue', major: '计算机科学与技术' },
    students: [ { label: '学号', value: '249980718' }, ... ],
    skills: ['HTML', 'CSS', 'JavaScript', 'Vue', ...],
    projects: [ { name: '校园二手交易平台', time: '2024.09 - 2024.12', desc: '...' }, ... ],
    hobbies: ['🏀 篮球', '📷 摄影', '📚 阅读', '💻 编程'],
    detailsExpanded: true,
    isDark: false,
    editMode: false,
  }
}
```

- 返回的对象里每个属性都是**响应式**的：模板引用它，改它，视图自动更新。
- 注意是 `data()` 函数返回新对象，不是 `data: {}` —— 避免多个实例共享同一份数据。

### 5.2 ref（组合式，基本类型/数组）

`SkillsSection.vue`：

```js
import { ref, computed, watch } from 'vue'
const appliedSkillKeyword = ref('')
// 取值：appliedSkillKeyword.value
```

- `ref` 包装成响应式对象，**读取/修改都要 `.value`**（模板里自动解包，不用写 `.value`）。
- 可包字符串、数字、布尔、数组。

### 5.3 reactive（组合式，对象）

`EditSection.vue`：

```js
import { reactive, watch } from 'vue'
const editForm = reactive({
  name: '', major: '', intro: '', skillsText: '',
})
// 直接用属性：editForm.name，不需要 .value
```

- `reactive` 只针对**对象/数组**；深层嵌套也自动响应式。
- 与 ref 对比：ref 适合"单个值"，reactive 适合"一组相关字段的表单/状态"。

### 5.4 computed 计算属性（缓存派生数据）

`AppFooter.vue`：

```js
const email = computed(() => props.students.find(s => s.label === '邮箱')?.value || '')
const phone = computed(() => props.students.find(s => s.label === '电话')?.value || '')
```

`SkillsSection.vue`：

```js
const filteredSkills = computed(() => {
  if (!appliedSkillKeyword.value.trim()) return props.skills
  const kw = appliedSkillKeyword.value.trim().toLowerCase()
  return props.skills.filter(skill => skill.toLowerCase().includes(kw))
})
```

知识点：
- computed 根据**依赖**自动重新计算，并**缓存**（依赖不变就不重算）。
- 适合：需要"基于已有数据再加工"的展示数据（筛选结果、派生文案）。
- 项目里也体现了"能在模板写表达式，但复杂逻辑要抽成 computed"的思路。

---

## 六、侦听器 watch（两种写法）

### 6.1 选项式 watch（App.vue）—— 监听 data 属性

```js
watch: {
  isDark(newVal) {
    console.log('主题切换为：', newVal ? '暗色' : '亮色')
  },
},
```

### 6.2 组合式 watch（SkillsSection）—— 监听 ref

```js
watch(keyword, (newVal) => {
  appliedSkillKeyword.value = newVal    // 输入即过滤
})
```

### 6.3 组合式 watch（EditSection）—— getter 形式监听 props

```js
watch(
  () => props.editMode,                   // getter：返回要侦听的值
  (val) => {
    if (val) {                            // 只在"开始编辑"时初始化表单
      editForm.name = props.student.name
      editForm.major = props.student.major
      editForm.intro = props.intro
      editForm.skillsText = props.skills.join(', ')
    }
  }
)
```

知识点：
- watch 监听"变化后干什么"（副作用）；computed 是"根据变化算什么"（派生值）。**别混用。**
- 监听 props 要写成 getter 形式 `() => props.editMode`。
- 选项式 `watch: { 键: 回调 }` 的键就是 data/computed 属性名。

---

## 七、生命周期钩子

`App.vue` 的 `mounted()`（组件挂载完成后执行一次）：

```js
mounted() {
  // 1. 恢复主题（读 localStorage）
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    this.isDark = true
    document.body.classList.add('dark-theme')
  }
  // 2. 生成头像
  this.avatarUrl = this.generateAvatarDataUrl(this.student.name)
  console.log('个人信息页面已挂载，Vue 3 选项式 API 运行正常。')
}
```

知识点：
- `mounted` = DOM 已插入页面后执行，适合**初始化外部数据、访问 DOM、恢复持久化状态**。
- 选项式写法是 `mounted() {}`；组合式写法是 `import { onMounted } from 'vue'` + `onMounted(() => {})`。
- 常见调用链：`beforeCreate → created → beforeMount → mounted → (更新: beforeUpdate → updated) → beforeUnmount → unmounted`。

---

## 八、样式与主题切换（Vue 参与的 CSS 机制）

### 8.1 全局 vs scoped 样式的项目约定

- 所有真实样式在 `App.vue` 的**非 scoped** `<style>` 里（用 CSS 变量实现主题）。
- 所有子组件的 `<style scoped>` 都是**空的** —— 这是项目刻意约定：样式统一放 App.vue，防止主题/布局被 scoped 局部化破坏。
- 插槽填进去的 DOM 依然在子组件模板内部，所以全局选择器（如 `.filter-box .clear-btn`）照样命中。

### 8.2 CSS 变量实现双主题

`App.vue`（默认亮色 + `.dark-theme` 暗色）：

```css
:root {
  --bg-card: #ffffff;
  --btn-primary: #4a7dff;
  ...
}
.dark-theme {
  --bg-card: #1f2937;
  --btn-primary: #60a5fa;
  ...
}
```

切换由 `document.body.classList.toggle('dark-theme', this.isDark)` 驱动（App.vue 方法里）：

```js
toggleTheme() {
  this.isDark = !this.isDark
  document.body.classList.toggle('dark-theme', this.isDark)
  try { localStorage.setItem('theme', this.isDark ? 'dark' : 'light') } catch (e) { }
}
```

知识点：切换根节点的 class → CSS 变量整站换肤，配 `transition: background 0.3s` 有平滑过渡。这是"Vue 控制 DOM class + CSS 变量"的经典组合。

### 8.3 其他 Vue 相关的页面细节

- 锚点导航：`href="#skills"` + 各 section `id` + `scroll-margin-top: 84px`（避开 sticky 头部）+ `html { scroll-behavior: smooth }`。
- 展开/收起动画：`:class="{ collapsed }"` + `max-height/opacity` 过渡（`.details-collapse`）。

---

## 九、配合 Vue 的常用 JS 技巧与 Web API

### 9.1 localStorage —— 主题持久化

```js
localStorage.getItem('theme')          // mounted 里恢复
localStorage.setItem('theme', 'dark')  // toggle 时保存
```

> 用 try/catch 包裹（用户隐私模式/部分环境会抛错）。

### 9.2 数组方法全家桶（本项目都在用）

| 方法 | 用途 | 项目出处 |
|---|---|---|
| `.find()` | 找第一个满足条件的元素 | AppFooter 取邮箱/电话 |
| `.filter()` | 过滤出新数组 | SkillsSection 筛选技能 |
| `.map()` | 逐个转换 | EditSection 逗号字符串→数组 |
| `.split(',')` | 字符串拆数组 | EditSection skillsText |
| `.join(', ')` | 数组拼字符串 | EditSection 初始化表单 |
| `.includes()` | 包含判断 | SkillsSection 关键字匹配 |
| `.trim()` | 去首尾空格 | 表单校验/编辑保存 |
| `[...new Set(arr)]` | 数组去重 | EditSection 保存技能 |
| `.length` | 取长度 | HeroSection 统计、空态判断 |
| 可选链 `?.` / `\|\|` | 安全取值 + 默认值 | AppFooter `find(...)?.value \|\| ''` |

### 9.3 模板字符串与字符处理

```js
// AppFooter：`` 模板字符串 + ${} 插值
`:href="`mailto:${email}`"`

// App.vue：名字首字符生成头像
const initial = (name || '?').charAt(0).toUpperCase()
```

### 9.4 SVG Data URL 生成图片（无外部资源）

```js
generateAvatarDataUrl(name) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const svg = `
    <svg xmlns="..." width="110" height="110">...</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
```

### 9.5 表单校验与提示

```js
if (!editForm.name.trim()) {
  alert('姓名不能为空')   // 简单交互式校验
  return
}
```

---

## 十、工程化要点

- **构建开发**：`npm run dev`（HMR 热更新 + Vue DevTools 浮层）；`npm run build`（唯一验证步骤）。
- **Windows 注意**：`npm` 的 PowerShell shim 被执行策略拦着，要用 `npm.cmd run ...`。
- **`@` 别名 → `src`**：配置在 `vite.config.js` 和 `jsconfig.json`（IDE 能识别）。
- **组件导入**：`<script setup>` 里 `import` 的组件**自动注册**，模板直接用（不用写 `components: {}`）；选项式才需要手动注册。
- **Node 版本要求**：Vite 8 需要 `^22.18.0 || >=24.12.0`（本机 v24）。

---

## 十一、项目里的"坑"与约定备忘

1. **`emits: ('x')` 标签语句 bug**：`emits:` 是标签标签（label），`('x')` 是表达式语句（no-op）——事件根本没声明。必须写 `emits('x')` 真实函数调用（IntroSection / ProjectSidebar 修过）。
2. **`defineModel` 与本地 ref 混用**：输入框必须绑定 defineModel 的 ref，否则模型成孤儿（SkillsSection 修过的 Bug，按钮永不显示）。
3. **父组件 `v-model:keyword="skillKeyword"`**：属性名要一致、父组件 data 里真要存在，否则绑到 undefined。
4. **作用域插槽必须解构使用插槽 props**，不能用父作用域里不存在的名字。
5. **已知遗留**：`EditSection` 声明了 `'clear-skill-filter'` 事件，没有任何组件监听（项目刻意保留的教学示例）。
6. **两列等高**：`.page-body` 用 `align-items: stretch`，侧边栏不能加 `position: sticky` / `align-self: flex-start`，否则左右高度错位。
7. **样式归属**：所有样式在 App.vue 全局块；子组件 scoped 留空（约定，别"纠正"）。

---

## 十二、自查清单（想复习 X → 去哪个文件看）

| 我想复习… | 打开文件 | 看哪块 |
|---|---|---|
| createApp / mount / 入口 | `src/main.js` + `index.html` | 全部 |
| 选项式 data / methods / watch / mounted | `src/App.vue` | `<script>` 全段 |
| 模板插值 / 三元 / .length | `HeroSection.vue` | 模板 |
| v-for + :key（数组/对象数组） | `ProfileSidebar.vue` / `ProjectsSection.vue` / `HobbiesSection.vue` | 模板 |
| 动态 class / 展开收起 | `IntroSection.vue` | 模板 |
| v-if / v-else / v-show | `SkillsSection.vue` / `EditSection.vue` | 模板 |
| v-model 表单 | `EditSection.vue` | 模板 input/textarea |
| v-model:xxx + defineModel | `SkillsSection.vue` + `App.vue` | 两边配套看 |
| props 声明（必填/默认） | `HeroSection.vue` / `ProfileSidebar.vue` | script |
| defineEmits + payload | `EditSection.vue` / `IntroSection.vue` | script |
| computed | `AppFooter.vue` / `SkillsSection.vue` | script |
| ref | `SkillsSection.vue` | script |
| reactive | `EditSection.vue` | script |
| watch（3 种写法） | `App.vue` / `SkillsSection.vue` / `EditSection.vue` | script |
| 默认插槽 + 后备内容 | `AppFooter.vue` + `App.vue` | 模板 |
| 具名插槽 | `AppHeader.vue` + `App.vue` | 模板 |
| 作用域插槽 | `SkillsSection.vue` + `App.vue` | 模板 |
| CSS 变量主题 | `App.vue` | `<style>` 的 `:root` / `.dark-theme` |
| localStorage + 生命周期 | `App.vue` | `mounted` / `toggleTheme` |

---

*本手册由项目源码自动提取整理，覆盖：入口与 SFC、模板指令、组件通信（props/emits/v-model/defineModel）、插槽三兄弟、组合式与选项式响应式 API、watch、生命周期、主题样式、JS/Web API 技巧、工程化与踩坑备忘。*