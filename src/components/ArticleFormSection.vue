<script setup>
/**
 * ============================================================
 * 【文章表单】src/components/ArticleFormSection.vue
 * ============================================================
 * 「新建」和「编辑」共用这一个组件：
 *   传 article = null    → 新建模式，底部是「保存草稿 / 保存并发布」
 *   传 article = 文章对象 → 编辑模式，底部只显示「保存修改」
 *
 * 【重要：它只 emit，不直接改数据】
 * 组件里碰不到 store —— 保存按钮只负责把表单内容打包成 payload 交出去，
 * 由 ArticleEditorView 决定是调 createArticle 还是 updateArticle。
 * 这样「表单长什么样」和「数据怎么存」就彻底解耦了。
 *
 * 【为什么编辑模式要用 :key 强制重新挂载？】
 * 从「编辑文章 1」直接切到「编辑文章 2」时，vue-router 复用的是同一个组件实例，
 * 不会重新执行 setup，上面的 reactive(form) 也就还是上一篇的内容。
 * 父组件给组件加上 :key，key 一变 Vue 就会销毁旧实例、重新挂载，
 * 重新执行 setup 时才能拿到新的 props。详情见 ArticleEditorView.vue。
 */
import { computed, reactive } from 'vue'
import { STATUS_TEXT } from '../stores/articleStore'

const props = defineProps({
  article: { type: Object, default: null },
})

const emits = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.article))

/** 只在组件挂载时初始化一次（配合父组件的 :key 使用） */
const form = reactive({
  title: props.article?.title ?? '',
  summary: props.article?.summary ?? '',
  content: props.article?.content ?? '',
  // 标签在 store 里是数组，表单里用逗号分隔的字符串编辑，提交时再拆回去
  tagsText: (props.article?.tags ?? []).join(', '),
})

/** 兼容中英文逗号，去空、去重 */
function parseTags() {
  return [
    ...new Set(
      form.tagsText
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
}

function submit(publish) {
  if (!form.title.trim()) {
    alert('文章标题不能为空')
    return
  }
  if (!form.content.trim()) {
    alert('文章正文不能为空')
    return
  }

  // publish 只在新建时有意义：编辑模式下父组件调用的是 updateArticle，
  // 而它不会碰 status —— 状态切换是列表页的独立操作。
  emits('submit', {
    payload: {
      title: form.title.trim(),
      summary: form.summary.trim() || '（未填写摘要）',
      content: form.content.trim(),
      tags: parseTags(),
    },
    publish,
  })
}
</script>

<template>
  <section class="panel article-form-panel">
    <div class="panel-head">
      <h2 class="panel-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <span v-if="isEdit" class="badge" :class="article.status === 'published' ? 'badge-published' : 'badge-draft'">
        当前状态：{{ STATUS_TEXT[article.status] }}
      </span>
    </div>

    <form class="form-grid" @submit.prevent="submit(isEdit ? false : true)">
      <div class="form-row full">
        <label for="artTitle">标题</label>
        <input id="artTitle" type="text" v-model="form.title" placeholder="请输入文章标题" />
      </div>

      <div class="form-row full">
        <label for="artSummary">摘要</label>
        <input id="artSummary" type="text" v-model="form.summary" placeholder="一句话说明这篇讲了什么（可留空）" />
      </div>

      <div class="form-row full">
        <label for="artContent">正文（空一行即分段）</label>
        <textarea id="artContent" rows="10" v-model="form.content" placeholder="请输入文章正文..."></textarea>
      </div>

      <div class="form-row full">
        <label for="artTags">标签（用逗号分隔）</label>
        <input id="artTags" type="text" v-model="form.tagsText" placeholder="例如：Vue,前端,总结" />
      </div>

      <div class="form-row full">
        <div class="edit-actions">
          <button type="button" class="btn btn-secondary" @click="emits('cancel')">取消</button>

          <!-- 编辑模式只有「保存修改」：状态不在这里改 -->
          <template v-if="isEdit">
            <button type="submit" class="btn btn-primary">保存修改</button>
          </template>
          <!-- 新建模式可以选存成草稿还是直接发布 -->
          <template v-else>
            <button type="button" class="btn btn-secondary" @click="submit(false)">保存草稿</button>
            <button type="submit" class="btn btn-primary">保存并发布</button>
          </template>
        </div>
      </div>
    </form>
  </section>
</template>