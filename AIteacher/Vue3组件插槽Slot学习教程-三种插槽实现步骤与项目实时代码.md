# Vue 3 组件插槽（Slot）学习教程 —— 三种插槽实现步骤 + 项目实时代码

> 适用对象：Vue 3 初学者（已学到"组件"章节，想搞懂插槽）
> 项目：`01-vue` 个人主页（Vue 3 + Vite，Options API 的 App.vue + `<script setup>` 子组件）
> 教程中的每一段代码都是从本项目里**原样复制**的"实时代码"，可以对照你本地文件查看。

---

## 目录

1. [核心思想：一句话记住插槽](#一核心思想一句话记住插槽)
2. [第 1 个例子：默认插槽 + 后备内容（AppFooter）](#第-1-个例子默认插槽--后备内容appfooter)
3. [第 2 个例子：具名插槽（AppHeader）](#第-2-个例子具名插槽appheader)
4. [第 3 个例子：作用域插槽（SkillsSection）](#第-3-个例子作用域插槽skillssection)
5. [最重要的知识点：作用域规则](#三最重要的知识点作用域规则)
6. [知识点清单（自测）](#四知识点清单自测)
7. [常见坑（新手必踩）](#五常见坑新手必踩)
8. [下一步练习建议](#六下一步练习建议)

---

## 一、核心思想：一句话记住插槽

> **子组件挖坑，父组件填料。**

- 子组件在自己模板里放一个 `<slot>` = 挖一个坑（占位符）
- 父组件在使用子组件时，标签里写的内容 = 填进坑里的料

```html
<!-- 子组件 MyCard.vue（示意，非本项目文件） -->
<div class="card">
  <slot></slot>          <!-- ← 这里就是个坑，父组件的内容会出现在这 -->
</div>

<!-- 父组件使用（示意） -->
<MyCard>
  <p>我是被填进去的内容</p>
</MyCard>
<!-- 最终渲染：
     <div class="card"><p>我是被填进去的内容</p></div> -->
```

**为什么需要插槽？**
没有插槽时，子组件的内容是写死的，父组件想改就得把整段代码搬走或传一堆 props。
有了插槽，子组件留出"可替换区"，父组件按需填内容 —— 组件复用性大大提高。

---

## 第 1 个例子：默认插槽 + 后备内容（AppFooter）

> 文件名：`src/components/AppFooter.vue` + 父组件 `src/App.vue`
> 知识点：**默认插槽**（unnamed slot）、**后备内容**（fallback content）

### 步骤 1：子组件挖坑 —— AppFooter.vue

当前项目中 `AppFooter.vue` 的实际代码：

```html
<!-- src/components/AppFooter.vue —— 模板部分（实时代码） -->
<template>
  <footer class="site-footer">
    <p class="footer-copyright">© {{ new Date().getFullYear() }} {{ student.name }} · 个人主页 · Powered by Vue 3 + Vite</p>

    <!-- ======== 默认插槽 ========
         父组件在 <AppFooter> 标签里写的内容，会替换掉下面这段「后备内容」。
         如果父组件什么都没写，就显示后备内容（邮箱 / 电话）。 -->
    <slot>
      <p class="footer-contact">
        <a v-if="email" :href="`mailto:${email}`">{{ email }}</a>
        <template v-if="email && phone"> · </template>
        <span v-if="phone">{{ phone }}</span>
      </p>
    </slot>
  </footer>
</template>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `<slot> ... </slot>` | 挖了一个**无名坑**（默认插槽） |
| 坑里面那段 `<p class="footer-contact">` | **后备内容**：父组件不填料时显示这个默认值 |

配套的 `<script setup>` 部分（邮箱/电话来自父组件传入的 `students` 列表）：

```html
<!-- src/components/AppFooter.vue —— script 部分（实时代码） -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  students: { type: Array, required: true },
})

const email = computed(() => props.students.find(s => s.label === '邮箱')?.value || '')
const phone = computed(() => props.students.find(s => s.label === '电话')?.value || '')
</script>
```

### 步骤 2：父组件填料 —— App.vue

`src/App.vue` 里的实际用法（**这段代码就是"填料"全过程**）：

```html
<!-- ========== 底部 ========== -->
<AppFooter :student="student" :students="students">
  <!-- 默认插槽：这里写的内容会替换掉 AppFooter 里的后备内容（邮箱/电话） -->
  <div class="footer-nav-links">
    <a href="#top">首页</a>
    <a href="#projects">项目经历</a>
    <a href="mailto:428608535@qq.com">联系我</a>
  </div>
</AppFooter>
```

**渲染结果：** 页脚显示父组件写的三个链接（首页 / 项目经历 / 联系我），后备内容（邮箱/电话）被整个替换。

> ⚠️ 注意：`<AppFooter>` 现在不是自闭合标签了，而是**开标签 + 内容 + 闭标签**。那些 props（`:student` 等）和平时一样写在开标签上。

### 步骤 3：新增样式 —— App.vue 全局 CSS

本项目约定：所有 CSS 放在 `App.vue` 的全局 `<style>` 里。父组件填进插槽的 DOM 依然渲染在子组件模板内部，所以全局选择器照样命中：

```css
/* .site-footer 相关样式附近（实时代码） */
.footer-nav-links {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 18px;
}

.footer-nav-links a {
  color: var(--btn-primary);
  text-decoration: none;
}
```

### ✅ 验证方法

把 `App.vue` 里 `<AppFooter>...</AppFooter>` 之间的内容**整段删掉** → 页脚恢复显示邮箱/电话（后备内容生效）；把内容填回去 → 显示你自己的链接。这就是"后备内容"的意义：**有默认、可覆盖**。

---

## 第 2 个例子：具名插槽（AppHeader）

> 文件名：`src/components/AppHeader.vue` + 父组件 `src/App.vue`
> 知识点：**具名插槽**（named slot）、`<template #名字>` 简写

一个组件可以挖**多个坑**，用 `name` 区分。默认插槽的 `name` 就是 `default`，不写名字的坑都归它。

### 步骤 1：子组件挖第 2 个坑 —— AppHeader.vue

在导航 `<nav>` 和主题开关按钮之间加一个具名插槽（实时代码）：

```html
<!-- src/components/AppHeader.vue —— 模板部分（实时代码） -->
<template>
  <header class="site-header" id="top">
    <div class="header-inner">
      <a class="brand" href="#top" title="回到顶部">
        <span class="brand-logo">{{ (name || 'P').charAt(0).toUpperCase() }}</span>
        <span class="brand-name">{{ name }} 的个人主页</span>
      </a>

      <nav class="header-nav">
        <a href="#top">首页</a>
        <a href="#intro">个人简介</a>
        <a href="#skills">技能标签</a>
        <a href="#projects">项目经历</a>
        <a href="#hobbies">兴趣爱好</a>
        <a href="#edit">编辑资料</a>
      </nav>

      <!-- ======== 具名插槽 #nav-extra ========
           父组件用 <template #nav-extra> 填到这里；
           不填就什么都不显示（这是一个可选区域）。 -->
      <slot name="nav-extra"></slot>

      <button class="header-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色主题' : '切换到暗色主题'">
        {{ isDark ? '☀️ 亮色模式' : '🌙 暗色模式' }}
      </button>
    </div>
  </header>
</template>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `<slot name="nav-extra"></slot>` | 挖了一个**贴了名字的坑** |
| 坑里没写后备内容 | 父组件不填就什么都不显示（可选区域） |

### 步骤 2：父组件指名填料 —— App.vue

```html
<!-- ========== 顶部导航 ========== -->
<AppHeader :name="student.name" :isDark="isDark" @toggle-theme="toggleTheme">
  <!-- 具名插槽 #nav-extra：填到 AppHeader 导航和主题开关之间 -->
  <template #nav-extra>
    <a class="header-extra-link" href="https://github.com/" target="_blank" rel="noopener">GitHub</a>
  </template>
</AppHeader>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `<template #nav-extra>` | **指名**填到名为 `nav-extra` 的坑里 |
| `#nav-extra` | 是 `v-slot:nav-extra` 的简写，程序员都用简写 |
| 不指名（不带 `#`）的内容 | 一律进默认插槽（`name="default"` 的坑） |

### 步骤 3：新增样式 —— App.vue 全局 CSS

```css
/* .header-nav a:hover 样式附近（实时代码） */
.header-extra-link {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.header-extra-link:hover {
  background: var(--tag-bg);
  color: var(--btn-primary);
}
```

### ✅ 验证方法

把 `<template #nav-extra>...</template>` 整段删掉 → 头部 GitHub 链接消失（坑空了，什么都不显示）。这就是具名插槽的"可选区域"效果。试着再填第二个链接（比如「关于我」），两个链接会在 `header-inner` 的 flex 布局里并排出现。

---

## 第 3 个例子：作用域插槽（SkillsSection）

> 文件名：`src/components/SkillsSection.vue` + 父组件 `src/App.vue`
> 知识点：**作用域插槽**（scoped slot）、插槽 props、`defineModel`
> 适用场景：**"内容由父组件决定，但数据在子组件手里"**

### 为什么需要作用域插槽？

前两个例子里，父组件填的内容只用到了**父组件自己的变量**。
但如果父组件想用**子组件内部的数据**（比如技能筛选的关键字、清空函数），直接写是**访问不到的** —— 因为插槽内容是在"父组件作用域"编译的。

解决办法：子组件把数据打包成"插槽 props"递出去，父组件解构接收。这就是作用域插槽。

### 步骤 1：子组件暴露「状态 + 动作」—— SkillsSection.vue

当前项目中的实时代码（下面这段是本轮改好的最终版）：

```html
<!-- src/components/SkillsSection.vue —— script 部分（实时代码） -->
<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  skills: { type: Array, required: true },
})

// 关键字由父组件持有，通过 v-model:keyword 双向绑定（唯一数据源）
const keyword = defineModel('keyword', { type: String, default: '' })

// 用于过滤的关键字（输入时同步）
const appliedSkillKeyword = ref('')

const filteredSkills = computed(() => {
  if (!appliedSkillKeyword.value.trim()) {
    return props.skills
  }
  const kw = appliedSkillKeyword.value.trim().toLowerCase()
  return props.skills.filter(skill => skill.toLowerCase().includes(kw))
})

// 输入即过滤
watch(keyword, (newVal) => {
  appliedSkillKeyword.value = newVal
})

// 按回车时立即应用
function applySkillFilter() {
  appliedSkillKeyword.value = keyword.value
}

// 把关键字与「清空」动作通过作用域插槽暴露给父组件
function clearSkillFilter() {
  keyword.value = ''
  appliedSkillKeyword.value = ''
}
</script>
```

```html
<!-- src/components/SkillsSection.vue —— 模板部分（实时代码） -->
<template>
  <section id="skills" class="section">
    <h2 class="section-title">技能标签</h2>
    <div class="filter-box">
      <input type="text" v-model="keyword" placeholder="输入关键词筛选技能..." @keyup.enter="applySkillFilter" />
      <slot :keyword="keyword" :clear="clearSkillFilter"></slot>
      <!-- ↑ 把关键字和清空函数打包递出去 -->
    </div>
    <div class="tags" v-if="filteredSkills.length > 0">
      <span class="tag" v-for="(skill, i) in filteredSkills" :key="i">
        {{ skill }}
      </span>
    </div>
    <p class="empty-hint" v-else>没有匹配的技能，试试其他关键词吧。</p>
  </section>
</template>
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `defineModel('keyword', ...)` | 声明一个"关键字"双向绑定（父组件用 `v-model:keyword` 控制） |
| `<slot :keyword="keyword" :clear="clearSkillFilter">` | 把子组件内部的两个东西打包成插槽 props 递出去 |
| `:keyword="keyword"` | 递出**当前关键字的值**（实时） |
| `:clear="clearSkillFilter"` | 递出**清空函数**（父组件点击时调用它） |
| `v-model="keyword"` | 输入框必须绑在 defineModel 上，打字才能同步到父组件（上一个版本的 Bug 就在这：输入框绑了另一个本地 ref，模型成了孤儿，按钮永远不出现） |

### 步骤 2：父组件解构接收并使用 —— App.vue

```html
<!-- src/App.vue —— 技能标签部分（实时代码） -->
<!-- 技能标签 -->
<SkillsSection v-model:keyword="skillKeyword" :skills="skills">
  <template #default="{ keyword, clear }">
    <!--                 ↑ 解构接收子组件递过来的两个数据 -->
    <button class="clear-btn" @click="clear" v-show="keyword">
      清空
    </button>
  </template>
</SkillsSection>
```

配套：`App.vue` 的 `data()` 里必须有 `skillKeyword: ''`（否则 `v-model:keyword` 绑到 undefined）：

```js
data() {
  return {
    skillKeyword: '',   // ← 关键字状态归父组件持有
    // ... 其他数据
  }
}
```

**看懂这段代码：**

| 代码 | 含义 |
|---|---|
| `<template #default="{ keyword, clear }">` | 解构接收子组件递出来的 `keyword` 和 `clear` |
| `v-show="keyword"` | 有输入内容 → “清空”按钮出现；清空后自动消失 |
| `@click="clear"` | 点击调用子组件递出来的清空函数 |
| `v-model:keyword="skillKeyword"` | 关键字父组件也有份（双向同步） |

### 步骤 3：按钮样式

插槽内容 DOM 依然在 `.filter-box` 内部，项目全局 CSS 里的 `.filter-box .clear-btn` 选择器照常命中（样式不用改）。

### ✅ 验证方法

在技能输入框里打字 → “清空”按钮出现；点按钮 → 输入框和按钮都清空，技能列表恢复全部。

---

## 三、最重要的知识点：作用域规则

> 这就是你上一轮"清空按钮没有了"的根因，务必吃透。

**插槽内容的"视野" = 父组件作用域。** 它写在父组件文件里，但渲染在子组件模板内。具体规则：

| 想用的变量 | 属于谁 | 能不能直接用 |
|---|---|---|
| `skillKeyword`（App.vue 的 data） | 父组件 | ✅ 可以 |
| `hobbies`、`students` 等 App.vue 的数据 | 父组件 | ✅ 可以 |
| `keyword`、`clear`（SkillsSection 内部的） | 子组件 | ⚠️ 必须通过插槽 props 拿 |
| `clearSkillFilter`（已从 App.vue 删掉的旧方法） | 不存在 | ❌ 报错 |
| 子组件内部同名 ref（比如子组件的 `skillKeyword`） | 子组件 | ❌ 访问不到，同名也不通 |

**记忆口诀：父能用父的；子要递出来（`<slot :prop>`)才能用（`#default="{ prop }"`）。**

配合理解 `defineModel` 的名词：它是 `modelValue` / `update:modelValue` 事件（或自定义名 `keyword` / `update:keyword`）的语法糖，让"父组件持有状态 + 单向数据流"写起来像双向绑定。链条是：

```
父组件 skillKeyword
   │  v-model:keyword（props 下发 / update:keyword 事件回收）
子组件 defineModel 的 keyword
   │  输入框 v-model="keyword"
用户打字 ──> keyword 变 ──> 父 skillKeyword 变 ──> 插槽 keyword 变 ──> 按钮 v-show 生效
```

---

## 四、知识点清单（自测）

- [ ] ① `<slot>` 是占位符，父组件内容出现在这里
- [ ] ② `<slot>后备内容</slot>` —— 父组件不填时显示默认值
- [ ] ③ `<slot name="xx">` + 父组件 `<template #xx>` = 具名插槽
- [ ] ④ 不带 `#` 的内容默认进 `default` 坑（默认插槽）
- [ ] ⑤ `<slot :some="data">` + `<template #default="{ some }">` = 作用域插槽
- [ ] ⑥ 插槽内容编译在父组件作用域：父的数据/方法直接用，子内部数据必须靠插槽 props 递
- [ ] ⑦ `#xx` 是 `v-slot:xx` 的简写；`#default="{ a }"` 是 `v-slot:default="{ a }"` 的简写
- [ ] ⑧ 一个组件可以有多个插槽（1 个默认 + N 个具名）
- [ ] ⑨ 具名插槽可以不填（内容为空的坑什么都不渲染，是"可选区域"）
- [ ] ⑩ 组件标签被父组件"开标签 + 内容 + 闭标签"包裹时，props 仍写在开标签上

---

## 五、常见坑（新手必踩）

1. **具名插槽忘了包 `<template>`**
   直接写 `<div>` 内容 → 悄悄掉进默认插槽，看起来"没渲染到想渲染的位置"。

2. **作用域插槽想访问子组件内部变量**
   渲染报错 `xxx is not defined`。记住：只能用解构出来的插槽 props。

3. **`v-slot` 写错位置**
   `v-slot` 只能写在 `<template>` 上（或组件自身标签上，仅限默认插槽时）；具名插槽必须配 `<template>`。

4. **输入框绑了本地 ref，defineModel 成了孤儿**
   子组件里数据源要唯一。要么全用 defineModel（本项目做法），要么全用本地 ref + 手动 emit，别混。

5. **父组件 `v-model` 属性名打错**
   `v-model:keyword="skillKeyword"` 里的属性名要和子组件 `defineModel('keyword')` 一致，且父组件 data 里要真存在这个属性，否则绑到 undefined。

6. **后备内容写太多**
   组件模板会臃肿。后备内容保持简短，复杂内容交给父组件填。

7. **以为插槽样式能被子组件 scoped 样式控制**
   本项目所有 CSS 在 App.vue 全局块，所以没这个问题；如果将来用 scoped 样式，插槽填充内容的样式由 **父组件** 控制（因为编译作用域在父组件）。

---

## 六、下一步练习建议

1. 把 `App.vue` 页脚默认插槽的内容删掉，刷新页面，观察后备内容（邮箱/电话）出现
2. 给 `AppHeader` 的 `#nav-extra` 再填一个链接（比如「关于我」），观察两个链接并排
3. 把 `SkillsSection` 的插槽改成 `<template #default>`（**不**解构变量），然后在里面直接写 `keyword` → 观察报错，加深作用域规则印象
4. 给 `AppFooter` 加第二个具名插槽 `name="extra"`，自己写一遍「子挖坑、父指名填」的完整流程
5. 挑战题：把「校验码/使用 qrcode 生成器生成`</qrcode>`」… 不用管，先做到上面 4 步即可

---

## 附：本轮涉及文件清单

| 文件 | 改动 |
|---|---|
| `src/components/AppFooter.vue` | 新增默认插槽（含后备内容） |
| `src/components/AppHeader.vue` | 新增具名插槽 `#nav-extra` |
| `src/components/SkillsSection.vue` | 作用域插槽 + defineModel（上一轮完成，教程引用） |
| `src/App.vue` | 父组件填料：填两个新插槽 + 新增 `.header-extra-link` / `.footer-nav-links` 样式 |


*本教程代码与项目当前状态一致，`npm.cmd run build` 验证通过（21 模块）。*