<script setup>
/**
 * ============================================================
 * 【文章卡片】src/components/ArticleCard.vue
 * ============================================================
 * 一篇文章的外壳：标题、状态标签、摘要、元信息。
 *
 * 【它为什么不自己管操作按钮？】
 * 因为「有哪些按钮」取决于文章状态：
 *   已发布 → 查看 / 编辑 / 转为草稿 / 删除
 *   草稿   →       编辑 / 发布     / 删除
 * 这个判断放在列表页（父组件）里更合适，因为它还要决定跳到哪个路由。
 * 所以本组件用两个【作用域插槽】把控制权交出去：
 *
 *   #title    标题区域。父组件可以传进来一个可点击的链接（已发布文章能点开看），
 *              不传就用默认的纯文字 —— 草稿点不开，正好符合预期。
 *   #actions  底部操作区，整个由父组件渲染。
 *
 * 插槽 props 同时透出 article 和 published，省得父组件再算一遍状态。
 */
import { computed } from 'vue'
import { STATUS_TEXT } from '../stores/articleStore'

const props = defineProps({
  article: { type: Object, required: true },
})

const isPublished = computed(() => props.article.status === 'published')

/** 已发布才显示「发布于」；还没发过的草稿这里没有值 */
const publishedDate = computed(() => props.article.publishedAt || '—')
</script>

<template>
  <article class="article-card">
    <div class="article-card-head">
      <!-- 作用域插槽 + 默认内容：父组件不传就用兜底的纯文本标题 -->
      <slot name="title" :article="article" :published="isPublished">
        <h3 class="article-name">{{ article.title }}</h3>
      </slot>

      <span class="badge" :class="isPublished ? 'badge-published' : 'badge-draft'">
        {{ STATUS_TEXT[article.status] }}
      </span>
    </div>

    <p class="article-summary">{{ article.summary || '（还没有写摘要）' }}</p>

    <p class="article-meta">
      <span>更新于 {{ article.updatedAt }}</span>
      <template v-if="isPublished">
        <span>·</span>
        <span>发布于 {{ publishedDate }}</span>
        <span>·</span>
        <span>阅读 {{ article.views }}</span>
      </template>
      <span>·</span>
      <span>{{ article.tags.length ? article.tags.join(' / ') : '无标签' }}</span>
    </p>

    <!-- $slots.actions 存在才渲染操作区，避免出现一条空的分隔线 -->
    <div class="article-actions" v-if="$slots.actions">
      <slot name="actions" :article="article" :published="isPublished"></slot>
    </div>
  </article>
</template>