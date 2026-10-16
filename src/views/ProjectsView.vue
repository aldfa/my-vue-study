<script setup>
/**
 * ============================================================
 * 【页面组件】src/views/ProjectsView.vue
 * 路由：/projects  （受保护：未登录会被守卫弹到 /login）
 * ============================================================
 * 实验要求 6：「实现项目信息和文章信息的增删改查」。
 * 文章的增删改查在 ArticlesView / ArticleEditorView 里，
 * 项目的增删改查就在这一页，两者用的是同一套 store 写法。
 *
 * 【页面内职责划分】
 *   列表渲染 → ProjectsSection（只渲染 + emit 意图）
 *   表单状态 → 本页的局部 ref（新增/编辑是纯页面交互，没必要进全局）
 *   数据读写 → profileStore 的 addProject / updateProject / removeProject
 *
 * 【为什么局部状态不塞进 store】
 * store 是给「跨组件、跨页面共享」的数据用的。
 * 「当前正在编辑第几条」「表单里输入到一半的内容」只属于这一页，
 * 放进全局 store 反而会残留到下一次进入页面时的脏值。
 * ============================================================ */
import { nextTick, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import ProjectsSection from '../components/ProjectsSection.vue'
import { useProfileStore } from '../stores/profileStore'

/** store 实例 —— action 从它身上调 */
const store = useProfileStore()

/**
 * storeToRefs（实验要求 3）：
 * 把 store 的 state 拆出来直接用在模板里，响应性不会断。
 *
 * 对比一下不用它的时候：
 *   const projects = store.projects     // 也能用，但每次访问都走一遍 store 的 getter
 *   const { projects } = store           // 断响应式 —— 拿到的是「当时那个数组」
 *   const { projects } = storeToRefs(store) // ✅ 既解构又保持响应式
 *
 * 只有 state / getter 会被包成 ref；action 不在解构之列，仍然从 store 上取。
 */
const { projects } = storeToRefs(store)

/* ---------- 表单状态（纯页面内，不进 store） ---------- */

/** 空表单。新增和编辑复用同一个对象，区别只在 editingId */
const EMPTY_FORM = { name: '', time: '', desc: '' }
const form = reactive({ ...EMPTY_FORM })

/** 正在编辑的项目 id；为 null 表示当前是「新增」模式 */
const editingId = ref(null)

/**
 * 表单是否展开。
 *
 * 交互对齐文章管理页的「＋ 新建文章」：编辑框平时不占版面，
 * 点「＋ 新建项目」或某张卡片的「编辑」才出现，保存/取消后再收起。
 * （和 /articles/new 的区别只在于这里是同页展开，不用跳路由。）
 */
const formVisible = ref(false)

/** 表单面板的 DOM 引用，展开后要滚到它上面 */
const formPanel = ref(null)

/** 表单标题随模式变化 */
const formTitle = ref('新增项目')

/** 表单校验错误，空字符串表示校验通过 */
const errorMsg = ref('')

/** 列表页上删除的二次确认结果，短暂显示一行提示 */
const tipMsg = ref('')

/**
 * 展开表单并滚到它那里。
 * 列表可能有十几条，表单在列表下方，不滚一下用户会以为没反应。
 */
async function openForm() {
  formVisible.value = true
  await nextTick() // 等 v-if 真正把 DOM 插进来，否则 scrollIntoView 找不到元素
  formPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

/** 点「＋ 新建项目」：以新增模式展开表单 */
function startCreate() {
  resetForm()
  openForm()
}

/** 点卡片上的「编辑」：把这一条回填进表单，并把表单标题切成「编辑项目」 */
function startEdit(project) {
  editingId.value = project.id
  form.name = project.name
  form.time = project.time
  form.desc = project.desc
  formTitle.value = `编辑项目：${project.name}`
  errorMsg.value = ''
  tipMsg.value = ''
  openForm()
}

/** 点「取消」：收起表单并复位成新增模式 */
function cancelEdit() {
  formVisible.value = false
  resetForm()
}

/** 只清空字段，不动展开状态（新增/编辑提交成功后复用） */
function resetForm() {
  editingId.value = null
  form.name = ''
  form.time = ''
  form.desc = ''
  formTitle.value = '新增项目'
  errorMsg.value = ''
}

/**
 * 提交表单：新增和编辑共用这一个入口，靠 editingId 分流。
 * 这也是 store 那边 add / update 分成两个 action 的原因 ——
 * 「怎么存」是数据层的事，「表单长什么样」是视图层的事，不要混着写。
 */
function submit() {
  if (!form.name.trim()) {
    errorMsg.value = '项目名称不能为空'
    return
  }
  if (!form.time.trim()) {
    errorMsg.value = '项目时间不能为空'
    return
  }

  const payload = {
    name: form.name.trim(),
    time: form.time.trim(),
    desc: form.desc.trim(),
  }

  if (editingId.value === null) {
    store.addProject(payload)
    tipMsg.value = `已新增「${payload.name}」`
  } else {
    store.updateProject(editingId.value, payload)
    tipMsg.value = `已保存「${payload.name}」的修改`
  }
  // 存完就收起，和「点按钮才出现」的开合逻辑对称
  cancelEdit()
}

/** 删除。二次确认放在视图层，store 只负责真的删 */
function removeProject(id) {
  const target = store.getProjectById(id)
  if (!target) return
  if (!confirm(`确定要删除项目「${target.name}」吗？删除后无法恢复。`)) return
  store.removeProject(id)
  // 正在编辑的恰好是这一条时，把表单整个收起来，否则会留着一个 id 已失效的编辑态
  if (editingId.value === id) cancelEdit()
  tipMsg.value = `已删除「${target.name}」`
}
</script>

<template>
  <div class="view-container">
    <ProjectsSection :projects="projects" @edit="startEdit" @remove="removeProject">
      <!-- 命名插槽：列表组件不关心这个按钮，只负责把它放在标题栏右侧 -->
      <template #head-extra>
        <button class="btn btn-primary btn-sm" @click="startCreate">＋ 新建项目</button>
      </template>
    </ProjectsSection>

    <!-- 新增 / 编辑表单：复用文章编辑页那套 .form-grid + .form-row 样式。
         v-if 让它平时不出现，点「＋ 新建项目」或卡片「编辑」才展开。 -->
    <section v-if="formVisible" ref="formPanel" class="panel article-form-panel">
      <div class="panel-head">
        <h2 class="panel-title">{{ formTitle }}</h2>
        <button v-if="editingId !== null" class="btn-link" @click="cancelEdit">取消编辑</button>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <div class="form-row">
          <label for="proj-name">项目名称</label>
          <input id="proj-name" type="text" v-model="form.name" placeholder="例如：校园二手交易平台" />
        </div>

        <div class="form-row">
          <label for="proj-time">项目时间</label>
          <input id="proj-time" type="text" v-model="form.time" placeholder="例如：2024.09 - 2024.12" />
        </div>

        <div class="form-row full">
          <label for="proj-desc">项目描述</label>
          <textarea id="proj-desc" rows="4" v-model="form.desc" placeholder="用一两句话说明技术栈和做了什么"></textarea>
        </div>

        <div class="form-row full">
          <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
          <p v-else-if="tipMsg" class="form-tip">{{ tipMsg }}</p>

          <div class="edit-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingId === null ? '新增项目' : '保存修改' }}
            </button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>