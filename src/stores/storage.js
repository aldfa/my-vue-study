/**
 * ============================================================
 * 【状态持久化工具】src/stores/storage.js
 * ============================================================
 * Pinia 本身【不提供】持久化能力。
 * store 里的 state 只是内存中的变量，刷新页面浏览器会重新执行一遍
 * state 的初始化表达式，所有改动都会归零。
 *
 * 手动实现的思路只有两步（实验原理 3.1.3）：
 *
 *   1. 初始化时读：state 的初始值不再是写死的常量，
 *      而是 loadState(key, 默认值) —— localStorage 里有就用存的，没有就用默认值。
 *   2. 修改后写：在 action 里改完 state，顺手调一次 saveState(key, value)，
 *      把新值 JSON.stringify 后写回 localStorage。
 *
 * 为什么必须包一层 try/catch？
 *   localStorage 在无痕模式、禁用 cookie、存储配额写满时会直接抛异常。
 *   而且 JSON.parse 一个被手工改坏的字符串也会抛异常。
 *   持久化是「锦上添花」的功能，绝不能因为它把整个应用搞崩 ——
 *   所以解析失败时静默回退到默认值，最坏结果只是数据没保存而已。
 *
 * 为什么统一加前缀？
 *   localStorage 是【整个域名】共享的，不加前缀极易和同域其它项目撞 key。
 * ============================================================
 */

/** 所有 key 统一前缀，避免和同域名下其它应用的键冲突 */
const STORAGE_PREFIX = 'vue3-lab:'

/** 拼出带前缀的完整 key */
function fullKey(key) {
  return STORAGE_PREFIX + key
}

/**
 * 读持久化状态。
 *
 * @param {string} key   存储键（不用带前缀）
 * @param {*} fallback  读不到 / 读坏了时的兜底值
 * @returns {*} localStorage 里的值，失败则返回 fallback
 *
 * 注意 fallback 是【默认值表达式】的求值结果，所以调用时要直接给常量，
 * 不要写成 loadState('x', someExpensiveThing())。
 */
export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(fullKey(key))
    // null 说明从来没保存过（首次访问），直接用默认值
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    // 存的是 "null" 时 JSON.parse 得到 null，这里也回退到默认值
    return parsed === null || parsed === undefined ? fallback : parsed
  } catch (e) {
    // 隐私模式读不到、或内容被改坏成非法 JSON
    return fallback
  }
}

/**
 * 写持久化状态。
 *
 * 只传【需要持久化的那一部分】state —— 比如文章列表变了，
 * 没必要把 lastId 之外的临时数据也塞进去。
 */
export function saveState(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value))
    return true
  } catch (e) {
    // 配额满 / 无痕模式不可写：功能降级，但不打断交互
    return false
  }
}

/**
 * 删除某个键 —— 「退出登录」「恢复初始数据」时用。
 */
export function removeState(key) {
  try {
    localStorage.removeItem(fullKey(key))
    return true
  } catch (e) {
    return false
  }
}

/**
 * 一键清空本应用写入的所有持久化数据。
 * 演示「刷新后数据被重置」时很有用。
 */
export function clearAllState() {
  try {
    const doomed = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_PREFIX)) doomed.push(k)
    }
    doomed.forEach((k) => localStorage.removeItem(k))
    return true
  } catch (e) {
    return false
  }
}

export { STORAGE_PREFIX }