/**
 * ============================================================
 * 【Pinia Store】src/stores/profileStore.js
 * ============================================================
 * 个人档案模块的 Setup Store，结构说明见下方「Setup Store 的三个关键点」。
 *
 * ============================================================
 * 本次实验（实验四·状态管理）新增的三件事
 * ============================================================
 * 1. 【持久化】用 src/stores/storage.js 把数据写进 localStorage，刷新不丢。
 * 2. 【getters】之前只有 state 和 actions，现在补上派生数据（见下方 getters 区）。
 * 3. 【项目增删改查】projects 从「只读展示」升级成可写，action 里改完自动持久化。
 *
 * ============================================================
 * 为什么这里必须有 store？
 * ============================================================
 * 改造之前：App.vue 用 data() 存数据，再通过 props 一层层传给 views。
 * 改造之后：页面由 <RouterView> 渲染，App.vue 无法往路由组件里塞 props，
 *          所以数据必须有一个「所有页面都能直接 import」的地方。
 *
 * ============================================================
 * Setup Store 的三个关键点
 * ============================================================
 * 1. 第一个参数是 store 的 id（字符串），用于 Pinia devtools 里区分，
 *    全局唯一 —— 这也是 defineStore 能「建多个 store」的依据。
 *
 * 2. 第二个参数是一个函数，里面正常写 ref / reactive / computed，
 *    最后 return 出去。Pinia 拿到返回值后，会把 ref 自动解包：
 *    组件里写 store.skills 就是数组，不用再 .value。
 *
 * 3. state 和 action 无法在语法上区分 —— 谁先被 return 谁就是 state，
 *    其余函数都是 action。Pinia 靠这个来分组，不是靠你写在 state 还是 actions 里。
 *
 * ============================================================
 * 迁移时最容易踩的坑：store 内部不能用 this
 * ============================================================
 * 之前（reactive 对象）：
 *   getById(id) { return this.articles.find(...) }
 *
 * 现在（Setup Store）：
 *   function getById(id) { return articles.value.find(...) }
 *
 * 原因：Setup Store 的第二个参数是个普通函数，它的 this 不指向 store。
 * 必须直接闭包引用上面声明的 ref，所以都要写 .value。
 *
 * 反过来，【组件里】不需要写 .value —— Pinia 会自动解包：
 *   store.projects          ✅ 组件 / setup 里
 *   projects.value          ✅ 只在 store 内部
 * ============================================================
 */
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { loadState, removeState, saveState } from './storage'

/** 本 store 的持久化 key（storage.js 会自动补 vue3-lab: 前缀） */
const STORAGE_KEY = 'profile'

/* ============================================================
 * 种子数据
 * ============================================================
 * 把默认值抽成模块级常量有两个好处：
 *   1. loadState 的第二个参数要有东西可传，写死在 useProfileStore 内部会让
 *      「状态声明区」被一大段对象淹没；
 *   2. 提供「恢复出厂设置」的实现：直接把常量赋回去即可。
 * ============================================================ */
const DEFAULT_STUDENT = {
  name: 'liuxue',
  major: '计算机科学与技术',
}

/** 学号 / 性别 / 邮箱 / 电话：属于固定的档案信息，不随表单变化，因此【不参与持久化】 */
const DEFAULT_STUDENTS = [
  { label: '学号', value: '24*******' },
  { label: '性别', value: '男' },
  { label: '邮箱', value: '*********@qq.com' },
  { label: '电话', value: '181-****-****' },
]

const DEFAULT_INTRO =
  '热爱编程与技术探索，熟悉前端基础（HTML / CSS / JavaScript）与 Vue 框架，' +
  '正在学习数据结构与算法。性格开朗，乐于团队协作，喜欢用代码把想法变成现实。' +
  '课余时间喜欢打篮球、摄影和阅读技术博客。'

const DEFAULT_SKILLS = ['HTML', 'CSS', 'JavaScript', 'Vue', 'Vite', 'Pinia', 'Axios', 'Git']

/**
 * 项目数据。
 * 每个项目现在带 id —— 增删改查靠它定位，否则只能用数组下标，
 * 删除中间一项后下标全部错位。
 */
const DEFAULT_PROJECTS = [
  {
    id: 1,
    name: '校园二手交易平台',
    time: '2024.09 - 2024.12',
    desc:
      '基于 Vue 3 + Vite 开发的前端项目，实现商品发布、搜索、收藏等功能，' +
      '使用 Pinia 管理状态，Axios 对接后端接口。',
  },
  {
    id: 2,
    name: '个人技术博客',
    time: '2024.05 - 2024.08',
    desc:
      '使用 HTML / CSS / JavaScript 搭建的静态博客，支持文章分类、' +
      '标签筛选与深色模式切换。',
  },
]

/**
 * 这里存的是「emoji + 空格 + 名称」的字符串，
 * HobbiesSection 里用 codePointAt 把它拆成图标和文字，
 * 保持了原有的数据结构和处理逻辑。
 */
const DEFAULT_HOBBIES = ['🏀 篮球', '📷 摄影', '📚 阅读', '💻 编程']

export const useProfileStore = defineStore('profile', () => {
  /* ============================================================
   * State
   * ============================================================
   * 每个 state 的初值都不是写死的常量，而是 loadState(key, 默认值)：
   * localStorage 里有存档就用存档，没有才用种子数据。
   * 这样「刷新页面恢复上次数据」就自动生效了，不需要任何额外的恢复逻辑。
   */

  /** 基本信息：用 reactive 而不是 ref —— 改子字段时不用写 store.student.value.name */
  const student = reactive({ ...DEFAULT_STUDENT, ...loadState(STORAGE_KEY + ':student', {}) })

  /**
   * 固定的档案信息（学号 / 性别 / 邮箱 / 电话）。
   *
   * 必须用 ref 包装，不能直接 `const students = DEFAULT_STUDENTS`。
   *
   * 【踩坑记录】Setup Store 里 return 一个【普通数组】会出两个问题：
   *   1. Pinia 判断「这是不是 state」的条件是 isRef(prop) || isReactive(prop)，
   *      普通数组两个都不是，于是它【不会被登记进 pinia.state】，
   *      devtools 里看不到，$patch / $subscribe 也管不到它；
   *   2. 更致命的是 storeToRefs —— 它内部同样只收 isRef / isReactive 的值，
   *      普通数组会被【静默跳过】，解构出来是 undefined。
   *      本项目 ProfileView 正是用 storeToRefs 解构 students 的，
   *      不加 ref 的话那一栏档案信息会直接消失。
   * 所以 store 里凡是「数据」的，一律 ref / reactive 包好再 return。
   *
   * spread 复制一层，避免组件误改时污染模块级常量。
   */
  const students = ref(DEFAULT_STUDENTS.map((s) => ({ ...s })))

  const avatarUrl = ref('')

  const intro = ref(loadState(STORAGE_KEY + ':intro', DEFAULT_INTRO))

  const skills = ref(loadState(STORAGE_KEY + ':skills', DEFAULT_SKILLS))

  const projects = ref(normalizeProjects(loadState(STORAGE_KEY + ':projects', DEFAULT_PROJECTS)))

  const hobbies = ref(loadState(STORAGE_KEY + ':hobbies', DEFAULT_HOBBIES))

  /* 交互状态：个人简介的展开/收起。属于 UI 状态，但也持久化，
     否则刷新后展开状态会突然跳回去。 */
  const detailsExpanded = ref(loadState(STORAGE_KEY + ':details', true))

  /* ============================================================
   * Getters（派生数据）
   * ============================================================
   * 之前这个 store 只有 state 和 actions。凡是「由 state 算出来、不需要单独存」
   * 的值，都属于 getter 的范畴，用 computed 声明。
   *
   * computed 的两个特性正好对应需求：
   *   1. 【有缓存】：依赖没变时不会重复计算；
   *   2. 【自动跟随】：它依赖的 state 一变，自己就更新，调用方不用手动同步。
   *
   * 用法上和 state 完全一样（都是 store.xxx），但【不能传参】——
   * 「按 id 查某一篇文章」这种需要参数的查询属于 action，不是 getter。
   */

  /** 技能数量 —— 身份卡上的统计数字 */
  const skillCount = computed(() => skills.value.length)

  /** 项目数量 */
  const projectCount = computed(() => projects.value.length)

  /** 爱好数量 */
  const hobbyCount = computed(() => hobbies.value.length)

  /** 三个数字的汇总，ProfileView 一次就能拿到全部统计 */
  const stats = computed(() => ({
    skills: skillCount.value,
    projects: projectCount.value,
    hobbies: hobbyCount.value,
  }))

  /** 姓名首字母 —— 头像用的就是它 */
  const nameInitial = computed(() => (student.name || '?').charAt(0).toUpperCase())

  /** 档案完整度：填了简介、技能、项目才算「资料齐全」，用于提示用户去补全 */
  const isProfileComplete = computed(() => Boolean(intro.value) && skills.value.length > 0)

  /* ============================================================
   * Actions
   * ============================================================
   * action 是修改 state 的唯一推荐入口（Pinia 官方说法）。
   * 组件里不要写 store.projects.push(...)：
   *   1. 绕过了 action，将来加埋点 / 校验 / 持久化时得挨个地方补；
   *   2. 本项目的持久化正是写在 action 里的，绕过 action = 数据不会保存。
   */

  /**
   * 写回 localStorage。
   * 每个写 action 末尾都调它 —— 这就是「持久化」的全部工作量。
   */
  function persist() {
    saveState(STORAGE_KEY + ':student', student)
    saveState(STORAGE_KEY + ':intro', intro.value)
    saveState(STORAGE_KEY + ':skills', skills.value)
    saveState(STORAGE_KEY + ':projects', projects.value)
    saveState(STORAGE_KEY + ':hobbies', hobbies.value)
    saveState(STORAGE_KEY + ':details', detailsExpanded.value)
  }

  /**
   * 编辑页保存时调这个，把表单内容一次性写回 store。
   * 集中在一个 action 里，而不是让 EditView 自己去一个个赋值 ——
   * 以后加字段只需要改这一个函数。
   */
  function updateProfile(payload) {
    student.name = payload.name
    student.major = payload.major
    intro.value = payload.intro
    skills.value = payload.skills
    // 姓名变了，头像那个字也得跟着重新生成
    avatarUrl.value = generateAvatarDataUrl(payload.name)
    persist()
  }

  /** 简介的展开 / 收起。之前是在模板里直接改 state，这里收进 action 才能持久化 */
  function toggleDetails() {
    detailsExpanded.value = !detailsExpanded.value
    persist()
  }

  /* ---------- 项目：增删改查 ---------- */

  /**
   * 下一个可用的项目 id = 现有最大 id + 1，空数组时从 1 开始。
   * 必须写在 store 内部 —— 它要读 projects，而 projects 只在这个闭包里可见。
   */
  function nextProjectId() {
    return projects.value.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  }

  /**
   * 新增项目，返回新建出来的对象。
   * id 用「现有最大 id + 1」而不是 Date.now()：
   * 前者保证刷新后 id 依然稳定可读，后者在同一毫秒建两条会撞号。
   */
  function addProject(payload) {
    const project = {
      id: nextProjectId(),
      name: payload.name,
      time: payload.time,
      desc: payload.desc,
    }
    // unshift：最新的项目排在最前面，和文章列表的直觉一致
    projects.value.unshift(project)
    persist()
    return project
  }

  /** 修改项目。查不到返回 null，调用方负责兜底 */
  function updateProject(id, payload) {
    const target = projects.value.find((item) => item.id === Number(id))
    if (!target) return null
    target.name = payload.name
    target.time = payload.time
    target.desc = payload.desc
    persist()
    return target
  }

  /** 删除项目。这是不可逆操作，二次确认由调用方（视图）负责 —— store 不弹窗 */
  function removeProject(id) {
    const index = projects.value.findIndex((item) => item.id === Number(id))
    if (index === -1) return false
    projects.value.splice(index, 1)
    persist()
    return true
  }

  /** 按 id 取单个项目，给编辑表单回填用 */
  function getProjectById(id) {
    return projects.value.find((item) => item.id === Number(id)) || null
  }

  /**
   * 恢复出厂设置：state 全部赋回种子数据，并清掉 localStorage。
   * 演示时想快速回到初始状态就用它，不用手动一个个删存储。
   */
  function resetProfile() {
    Object.assign(student, DEFAULT_STUDENT)
    intro.value = DEFAULT_INTRO
    skills.value = [...DEFAULT_SKILLS]
    projects.value = DEFAULT_PROJECTS.map((p) => ({ ...p }))
    hobbies.value = [...DEFAULT_HOBBIES]
    detailsExpanded.value = true
    avatarUrl.value = generateAvatarDataUrl(student.name)
    persist()
  }

  /** 只清持久化、不改当前内存状态。刷新之后才会变回种子数据 */
  function clearPersisted() {
    ;['student', 'intro', 'skills', 'projects', 'hobbies', 'details'].forEach((suffix) =>
      removeState(STORAGE_KEY + ':' + suffix),
    )
  }

  return {
    // state
    student,
    students,
    avatarUrl,
    intro,
    skills,
    projects,
    hobbies,
    detailsExpanded,
    // getters
    skillCount,
    projectCount,
    hobbyCount,
    stats,
    nameInitial,
    isProfileComplete,
    // actions
    updateProfile,
    toggleDetails,
    addProject,
    updateProject,
    removeProject,
    getProjectById,
    resetProfile,
    clearPersisted,
  }
})

/* ============================================================
 * 模块级工具函数
 * ============================================================
 * 写成普通函数而不是 store 的 action，是因为它们【不碰 state】，
 * 只有需要共享的状态和方法才进 store（见下方 generateAvatarDataUrl 的说明）。
 * ============================================================ */

/**
 * 保证每个项目都有数字 id。
 * 为什么要专门兜一层？
 *   实验一开始持久化时，老用户 localStorage 里存的是【没有 id】的旧格式项目。
 *   如果直接拿来用，addProject 的 nextProjectId() 和 updateProject 都会失效。
 *   所以每次读取都过一道这个函数，缺 id 的补上，形状永远一致。
 */
function normalizeProjects(list) {
  if (!Array.isArray(list)) return DEFAULT_PROJECTS.map((p) => ({ ...p }))
  return list.map((item, index) => ({
    id: Number.isFinite(item.id) ? item.id : index + 1,
    name: item.name ?? '',
    time: item.time ?? '',
    desc: item.desc ?? '',
  }))
}

/**
 * 头像是用姓名字首生成的 SVG，转成 data URL 直接塞给 <img src>
 * 单独抽成函数，多处要用就不重复写了。
 *
 * 它是纯函数、不碰 state，所以没有放进 store 的 return 里 ——
 * 只有需要共享的状态和方法才进 store。
 */
export function generateAvatarDataUrl(name) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110"><rect width="100%" height="100%" fill="#eef2ff"/><text x="50%" y="50%" font-size="48" fill="#4a7dff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${initial}</text></svg>`
  return 'data:image/svg+svg;utf8,' + encodeURIComponent(svg)
}