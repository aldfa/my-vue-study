import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  base:'/my-vue-study/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

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
})
