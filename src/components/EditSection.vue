<script setup>
import { reactive } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  intro: { type: String, default: '' },
  skills: { type: Array, required: true },
})

const emits = defineEmits(['save-edit', 'cancel-edit'])

// 每次进入编辑页组件都会重新挂载，直接以当前数据初始化表单
const editForm = reactive({
  name: props.student.name,
  major: props.student.major,
  intro: props.intro,
  skillsText: props.skills.join(', '),
})

function saveEdit() {
  if (!editForm.name.trim()) {
    alert('姓名不能为空')
    return
  }

  const newSkills = editForm.skillsText
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  emits('save-edit', {
    name: editForm.name.trim(),
    major: editForm.major.trim() || '未填写',
    intro: editForm.intro.trim() || '这个人很懒，什么都没写。',
    skills: [...new Set(newSkills)],
  })
}
</script>

<template>
  <section class="panel edit-panel">
    <div class="panel-head">
      <h2 class="panel-title">个人信息编辑</h2>
    </div>

    <form class="form-grid" @submit.prevent="saveEdit">
      <div class="form-row">
        <label for="editName">姓名</label>
        <input id="editName" type="text" v-model="editForm.name" placeholder="请输入姓名" />
      </div>
      <div class="form-row">
        <label for="editMajor">专业</label>
        <input id="editMajor" type="text" v-model="editForm.major" placeholder="请输入专业" />
      </div>
      <div class="form-row full">
        <label for="editIntro">个人简介</label>
        <textarea id="editIntro" rows="4" v-model="editForm.intro" placeholder="请输入个人简介"></textarea>
      </div>
      <div class="form-row full">
        <label for="editSkills">技能标签（用英文逗号分隔）</label>
        <input id="editSkills" type="text" v-model="editForm.skillsText" placeholder="例如：HTML,CSS,Vue" />
      </div>
      <div class="form-row full">
        <div class="edit-actions">
          <button type="button" class="btn btn-secondary" @click="emits('cancel-edit')">取消</button>
          <button type="submit" class="btn btn-primary">保存修改</button>
        </div>
      </div>
    </form>
  </section>
</template>
