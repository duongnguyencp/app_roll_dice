<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="card" style="max-width:400px; width:100%; text-align:center;">
      <p style="font-size:1rem; margin-bottom:1.5rem; line-height:1.6;">{{ message }}</p>
      <div style="display:flex; gap:0.7rem; justify-content:center;">
        <button class="btn-secondary" @click="$emit('cancel')">Huỷ</button>
        <button class="btn-danger" @click="$emit('confirm')">Xác nhận xóa</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
}
</style>
