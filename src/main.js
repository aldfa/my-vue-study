/**
 * ============================================================
 * 【应用入口】src/main.js
 * ============================================================
 * 这里按顺序装了三个东西：
 *
 *   createApp(App)          创建 Vue 应用实例
 *     .use(pinia)            装 Pinia —— 所有 store 必须在它之后才能被 use
 *     .use(router)           装路由 —— 注入后全局才认识 <RouterLink> 和 <RouterView>
 *     .mount('#root')        挂载到 index.html 里的 id="root"
 *
 * 【两个 .use 的顺序有讲究】
 * router 和 pinia 互不依赖，先后无所谓，但都必须在 createApp() 之后、
 * mount() 之前 —— mount() 才是真正把组件挂到 DOM 上，
 * 那一刻它们必须已经装好，否则组件里用 store 会报
 * "getActivePinia()... no active Pinia"。
 *
 * 另一个 Pinia 常见坑：store 必须在【组件的 setup 执行时】调用 useXxxStore()，
 * 不能在模块顶层就调用。因为那时还没有「当前应用」的 Pinia 实例。
 * 本项目所有页面都是在 <script setup> 里调的，所以没问题。
 *
 * 挂载点：index.html 里的 id="root"
 * ============================================================
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// createPinia() 必须先调用拿到实例，再 .use() 注册到应用上
const pinia = createPinia()

createApp(App).use(pinia).use(router).mount('#root')