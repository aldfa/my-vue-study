/**
 * ============================================================
 * 【Pinia Store】src/stores/userStore.js
 * ============================================================
 * 登录状态模块 —— 实验要求 5：
 * 「结合用户 Store 和路由守卫，实现基于登录状态的后台管理页面访问控制，
 *   未登录时自动跳转到登录页」。
 *
 * ============================================================
 * 关于「这是假登录」的说明
 * ============================================================
 * 本实验没有后端，所以这里【不做真正的身份校验】：
 *   - 不请求接口、不校验密码、不发 token；
 *   - signIn() 直接把一个演示账号写进 store 就算「登录成功」。
 *
 * 但「登录状态 → 访问控制 → 刷新后仍然保持」这条完整链路是真的：
 *   state(是否有登录态) → 路由守卫读取它 → 未登录拦截并跳转 →
 *   登录态持久化到 localStorage → 刷新后守卫依然认识你。
 *
 * 也就是说，将来接后端时，只需要把 signIn 里的假逻辑换成一次真实的
 * 接口请求（甚至改成 async action），其它代码一行都不用动。
 * ============================================================
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadState, removeState, saveState } from './storage'

/** 持久化 key */
const STORAGE_KEY = 'user'

/**
 * 演示账号表。
 * 真实项目里这份数据在服务端，前端根本拿不到；
 * 这里写死在前端，仅仅是为了让「登录」这个动作有个可点的对象。
 */
const DEMO_ACCOUNTS = [
  { account: 'admin', name: 'liuxue', role: 'admin', title: '管理员' },
  { account: 'editor', name: 'editor', role: 'editor', title: '内容编辑' },
]

/**
 * 伪 token。
 * 格式刻意写成 token_xxx 的样子，让 devtools / network 里看起来像那么回事，
 * 但它【不含任何加密信息】，只是给演示用的一个标识串。
 */
function fakeToken(account) {
  return `token_${account}_${Date.now().toString(36)}`
}

export const useUserStore = defineStore('user', () => {
  /* ---------- State ----------
     初值直接从 localStorage 读：刷新页面时这里就已经是登录态，
     路由守卫的第一次导航因此能正确放行，不会先闪一下再跳转。 */
  const user = ref(loadState(STORAGE_KEY, null))

  /** 演示账号列表，登录页渲染可选项用。
    用 ref 包装的原因见 profileStore.js 里 students 的注释：
    普通数组不会被 Pinia 登记成 state，storeToRefs 也会静默跳过它。 */
const accounts = ref(DEMO_ACCOUNTS.map((a) => ({ ...a })))

  /* ============================================================
   * Getters
   * ============================================================
   * 「是否已登录」是整个访问控制的核心判断。
   * 写成 getter 而不是普通函数的原因：
   *   1. 它完全由 state 推导，属于派生数据；
   *   2. computed 带缓存 —— 路由守卫和多个组件同时读也只算一次；
   *   3. 它是【响应式】的，登录态一变，所有用到它的地方自动更新，
   *      导航栏的按钮文字、页面上的提示条都不需要手动同步。
   * ============================================================ */

  /** 是否已登录。守卫判断的就是它 */
  const isLoggedIn = computed(() => Boolean(user.value && user.value.account))

  /** 顶栏显示的用户名，未登录时给一个占位 */
  const displayName = computed(() => (user.value ? user.value.name : '未登录'))

  /** 角色，用于 meta.role 的细粒度判断（本实验只演示到这一步） */
  const role = computed(() => (user.value ? user.value.role : ''))

  /** 角色中文名 */
  const roleText = computed(() => (user.value ? user.value.title : '访客'))

  /** 状态条上展示的简短描述 */
  const statusText = computed(() =>
    user.value ? `${user.value.name} · ${user.value.title}` : '访客模式，仅可浏览公开页面',
  )

  /* ============================================================
   * Actions
   * ============================================================ */

  /**
   * 「登录」：写入登录态并持久化。
   * account 为空时默认用第一个演示账号 —— 因为是假登录，
   * 没有输错账号的可能，点一下就是登录成功。
   */
  function signIn(account) {
    // store 内部访问 ref 必须写 .value（组件里才不用写）
    const picked = accounts.value.find((a) => a.account === account) || accounts.value[0]
    user.value = {
      account: picked.account,
      name: picked.name,
      role: picked.role,
      title: picked.title,
      token: fakeToken(picked.account),
      loginAt: todayStr(),
    }
    saveState(STORAGE_KEY, user.value)
    return user.value
  }

  /**
   * 「退出」：清空登录态，并【同时删掉 localStorage】。
   * 只置空不删存储的话，刷新一下又会自动登录，演示时会显得很假。
   */
  function signOut() {
    user.value = null
    removeState(STORAGE_KEY)
  }

  /**
   * 供守卫调用：确保登录态已从 localStorage 恢复。
   *
   * 其实 state 初值已经读过一次了，这里再提供一个显式入口，
   * 好处是语义清楚 —— 读档这个动作发生在「应用启动」这个明确时刻，
   * 而不是散落在每个 store 的初始化表达式里。
   */
  function restore() {
    user.value = loadState(STORAGE_KEY, null)
    return user.value
  }

  /** 刷新页面后，登录态是否还能从存储里读回来（持久化是否生效的自检） */
  function isPersisted() {
    return Boolean(loadState(STORAGE_KEY, null))
  }

  return {
    // state
    user,
    accounts,
    // getters
    isLoggedIn,
    displayName,
    role,
    roleText,
    statusText,
    // actions
    signIn,
    signOut,
    restore,
    isPersisted,
  }
})

/** 当天的 YYYY-MM-DD，只作为「登录时间」的展示值 */
function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}