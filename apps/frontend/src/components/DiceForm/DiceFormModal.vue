<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal card" style="max-width:440px; width:100%;">
      <h2 style="margin-bottom:1.2rem;">{{ editing ? 'Sửa xúc xắc' : 'Tạo xúc xắc mới' }}</h2>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Tên xúc xắc *</label>
          <input v-model="form.name" placeholder="VD: Thưởng học tập" maxlength="100" />
          <p v-if="errors.name" class="error-msg">{{ errors.name }}</p>
        </div>

        <div class="form-group">
          <label>Số mặt *</label>
          <input
            v-model.number="form.number_of_faces"
            type="number"
            min="2"
            max="1000"
            step="1"
            :disabled="facesLocked"
            :title="facesLocked ? 'Không thể sửa số mặt khi đã có phần thưởng' : ''"
          />
          <p v-if="facesLocked" class="error-msg" style="color:var(--text-muted);">
            ⚠️ Đã có phần thưởng — không thể sửa số mặt
          </p>
          <p v-else-if="errors.number_of_faces" class="error-msg">{{ errors.number_of_faces }}</p>
        </div>

        <p v-if="submitError" class="error-msg" style="margin-bottom:0.8rem;">{{ submitError }}</p>

        <div style="display:flex; gap:0.7rem; justify-content:flex-end;">
          <button type="button" class="btn-secondary" @click="$emit('close')">Huỷ</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ editing ? 'Lưu thay đổi' : 'Tạo' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useDiceStore } from '@/stores/dice.store'
import type { DiceWithRewardCount } from '@/types'

const props = defineProps<{ editing: DiceWithRewardCount | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const diceStore = useDiceStore()

const form = reactive({
  name: props.editing?.name ?? '',
  number_of_faces: props.editing?.number_of_faces ?? 6,
})
const errors = reactive({ name: '', number_of_faces: '' })
const submitError = ref('')
const loading = ref(false)

const facesLocked = computed(
  () => !!props.editing && (props.editing.reward_count ?? 0) > 0
)

function validate(): boolean {
  errors.name = ''
  errors.number_of_faces = ''
  let ok = true

  if (!form.name.trim()) {
    errors.name = 'Tên xúc xắc không được để trống'
    ok = false
  } else if (form.name.length > 100) {
    errors.name = 'Tên xúc xắc tối đa 100 ký tự'
    ok = false
  }

  if (!Number.isInteger(form.number_of_faces)) {
    errors.number_of_faces = 'Số mặt phải là số nguyên'
    ok = false
  } else if (form.number_of_faces < 2) {
    errors.number_of_faces = 'Xúc xắc phải có ít nhất 2 mặt'
    ok = false
  } else if (form.number_of_faces > 1000) {
    errors.number_of_faces = 'Số mặt tối đa là 1000'
    ok = false
  }

  return ok
}

async function submit() {
  if (!validate()) return
  loading.value = true
  submitError.value = ''

  try {
    if (props.editing) {
      await diceStore.update(props.editing.dice_id, {
        name: form.name,
        ...(!facesLocked.value ? { number_of_faces: form.number_of_faces } : {}),
      })
    } else {
      await diceStore.create(form.name, form.number_of_faces)
    }
    emit('saved')
  } catch (e) {
    submitError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  padding: 1rem;
}
</style>
