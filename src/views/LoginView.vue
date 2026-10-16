<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/LoginView.vue
 * 路由：/login  （受路由守卫保护：已登录时会被自动送走）
 * ============================================================
 * 本实验【不做真实的登录】，页面上的所有操作都是假的：
 *   点「模拟登录」→ userStore.signIn() 写入一个演示账号
 *   点「退出登录」 → userStore.signOut() 清空它
 *
 * 但流程是真的：跳进来时守卫已经确认过「你没登录」，
 * 登录成功后再由页面负责把你送回 redirect 指定的那一页。
 *
 * 守卫与本页的分工（别在两边都写跳转，会打架）：
 *   守卫  —— 判断「能不能进」，决定把人踢到哪
 *   本页  —— 登录成功后决定「去哪」
 * ============================================================
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/userStore'

const route = useRoute()
const router = useRouter()

/** store 实例本身保留给 action 调用 */
const store = useUserStore()

/**
 * storeToRefs：把 store 里的 state / getter 拆成【保持响应性的】 ref。
 *
 * 为什么不能直接解构？
 *   const { isLoggedIn } = useUserStore()
 * 这一行拿到的是「登录那一刻的值」，之后 store 变了它也不会变 ——
 * 响应式在被解构的那一步就断了。
 *
 * storeToRefs 做的正是「解构但不断链」：
 *   - state 和 getter（isLoggedIn / displayName 都是 getter）→ 包装成 ref；
 *   - action（signIn / signOut）→ 不需要包装，因为它不是数据，
 *     直接从 store 上解构使用即可，详见下方 submit()。
 *
 * 用法上和 ref 完全一样，模板里 .value 会被自动解包。
 */
const { isLoggedIn, displayName, roleText, statusText, accounts, user } = storeToRefs(store)

/** 登录完成后要送回哪里 —— 就是守卫记在 URL 上的 ?redirect= */
const redirectTo = computed(() => route.query.redirect || '/profile')

/** 当前是不是被守卫拦截过来的（URL 上带着 redirect），用来显示提示语 */
const wasBlocked = computed(() => Boolean(route.query.redirect))

/** 选中哪个演示账号。假登录也给个选择，方便演示「不同角色」。
    注意这是纯页面内的 UI 状态，所以用局部 ref，不进 store。 */
const picked = ref(accounts.value[0]?.account)

/**
 * 登录态是否已落到 localStorage。
 *
 * 这里有个容易踩的坑：不能简单写成
 *   const persisted = computed(() => store.isPersisted())
 * 因为 localStorage 不是响应式数据，这个 computed 的依赖列表是【空的】，
 * 于是它只会算一次然后永久缓存 —— 登录之后这行提示永远不会变。
 *
 * 正确做法是把登录态读一遍，人为建立一个依赖：
 * 登录/退出让 user.value 变化 → 依赖失效 → 重新计算。
 */
const persisted = computed(() => {
  void user.value // 建立依赖：登录态一变就重算（void 表示这里只取依赖、不用返回值）
  return store.isPersisted()
})

/**
 * 模拟登录。
 *
 * 下面这一行是【直接从 store 上解构 action】的示范：
 * signIn 不需要 .value、也不需要包成 ref，因为它是个函数，
 * 函数本身不是响应式数据。storeToRefs 遇到函数会直接跳过。
 */
const { signIn, signOut } = store

function submit() {
  signIn(picked.value)
  // replace 而不是 push：登录页不该留在历史栈里，
  // 否则用户登录后按浏览器「后退」会退回登录页。
  router.replace(redirectTo.value)
}

/** 退出登录：清空登录态后回到公开页，否则会被守卫再次弹回来 */
function logout() {
  signOut()
  router.replace('/profile')
}
</script>

<template>
  <div class="view-container">
    <section class="panel auth-panel">
      <div class="panel-head">
        <h2 class="panel-title">身份验证</h2>
        <span class="badge" :class="isLoggedIn ? 'badge-published' : 'badge-draft'">
          {{ isLoggedIn ? '已登录' : '未登录' }}
        </span>
      </div>

      <p class="auth-intro">
        文章管理、项目管理与编辑资料属于「后台管理页面」，
        由 <code>router/index.js</code> 里的全局前置守卫统一拦截：
        未登录访问会立刻跳到本页，登录后自动返回你原本想去的地址。
      </p>

      <!-- 当前登录态：读的是 userStore 的 getter -->
      <div class="auth-state">
        <div class="auth-state-row">
          <span class="auth-state-label">当前身份</span>
          <strong class="auth-state-value">{{ displayName }}</strong>
        </div>
        <div class="auth-state-row">
          <span class="auth-state-label">角色</span>
          <span class="auth-state-value">{{ roleText }}</span>
        </div>
        <div class="auth-state-row">
          <span class="auth-state-label">状态说明</span>
          <span class="auth-state-value">{{ statusText }}</span>
        </div>
        <div class="auth-state-row">
          <span class="auth-state-label">登录时间</span>
          <span class="auth-state-value">{{ user?.loginAt || '—' }}</span>
        </div>
        <div class="auth-state-row">
          <span class="auth-state-label">持久化自检</span>
          <span class="auth-state-value">
            {{ persisted ? '登录态已写入 localStorage，刷新后依然有效' : '未写入存储' }}
          </span>
        </div>
      </div>

      <p v-if="wasBlocked" class="auth-notice">
        你刚才访问的页面需要登录，验证后会自动返回
        <code>{{ redirectTo }}</code>。
      </p>

      <!-- 未登录：选账号 + 模拟登录 -->
      <div v-if="!isLoggedIn" class="auth-form">
        <p class="auth-form-title">选择一个演示账号</p>
        <div class="account-choice">
          <button
            v-for="acc in accounts"
            :key="acc.account"
            type="button"
            class="account-card"
            :class="{ active: picked === acc.account }"
            @click="picked = acc.account"
          >
            <span class="account-name">{{ acc.name }}</span>
            <span class="account-role">{{ acc.title }}</span>
          </button>
        </div>

        <div class="auth-actions">
          <button class="btn btn-primary" @click="submit">模拟登录</button>
          <RouterLink class="btn btn-secondary" to="/profile">先去逛逛公开页</RouterLink>
        </div>

        <p class="auth-tip">
          说明：本实验没有后端，这里不校验密码、不发 token，
          只演示「登录态 → 访问控制 → 刷新保持」这条完整链路。
        </p>
      </div>

      <!-- 已登录：退出 -->
      <div v-else class="auth-form">
        <div class="auth-actions">
          <RouterLink class="btn btn-primary" to="/articles">去文章管理</RouterLink>
          <RouterLink class="btn btn-secondary" to="/projects">去项目管理</RouterLink>
          <button class="btn btn-danger" @click="logout">退出登录</button>
        </div>
        <p class="auth-tip">
          退出后上面的「登录时间 / token」会一起清空，
          再刷新页面也会保持未登录状态 —— 因为 signOut 同时删掉了 localStorage。
        </p>
      </div>
    </section>
  </div>
</template>