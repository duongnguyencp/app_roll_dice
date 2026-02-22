<template>
  <div class="page">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Quản lý Xúc xắc</h1>
      <button class="btn-primary" @click="showForm = true">+ Tạo mới</button>
    </div>

    <!-- Create / Edit Form Modal -->
    <DiceFormModal
      v-if="showForm"
      :editing="editingDice"
      @close="closeForm"
      @saved="onSaved"
    />

    <!-- Delete Confirm -->
    <ConfirmDialog
      v-if="deletingDice"
      :message="`Xóa xúc xắc '${deletingDice.name}'? Tất cả phần thưởng sẽ bị xóa theo.`"
      @confirm="confirmDelete"
      @cancel="deletingDice = null"
    />

    <!-- List -->
    <div v-if="diceStore.loading" style="text-align:center; padding:3rem; color:var(--text-muted)">
      <span class="spinner" style="width:32px;height:32px;"></span>
    </div>

    <div v-else-if="diceStore.list.length === 0" class="empty-state">
      <div class="empty-state-icon">🎲</div>
      <p>Chưa có xúc xắc nào. Tạo mới ngay!</p>
    </div>

    <div v-else style="display:grid; gap:1rem;">
      <div v-for="dice in diceStore.list" :key="dice.dice_id" class="card" style="display:flex; align-items:center; gap:1rem;">
        <div style="flex:1;">
          <div style="font-weight:600; font-size:1.05rem;">{{ dice.name }}</div>
          <div style="margin-top:0.3rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            <span class="tag">{{ dice.number_of_faces }} mặt</span>
            <span class="tag" :class="{ 'tag-accent': dice.reward_count === dice.number_of_faces }">
              {{ dice.reward_count }}/{{ dice.number_of_faces }} phần thưởng
            </span>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-shrink:0;">
          <RouterLink :to="`/manage/${dice.dice_id}/rewards`">
            <button class="btn-secondary" style="padding:0.4rem 0.9rem; font-size:0.85rem;">🎁 Rewards</button>
          </RouterLink>
          <button class="btn-secondary" style="padding:0.4rem 0.9rem; font-size:0.85rem;" @click="startEdit(dice)">✏️</button>
          <button class="btn-danger" style="padding:0.4rem 0.9rem; font-size:0.85rem;" @click="startDelete(dice)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDiceStore } from '@/stores/dice.store'
import DiceFormModal from '@/components/DiceForm/DiceFormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { DiceWithRewardCount } from '@/types'

const diceStore = useDiceStore()

const showForm = ref(false)
const editingDice = ref<DiceWithRewardCount | null>(null)
const deletingDice = ref<DiceWithRewardCount | null>(null)

onMounted(() => diceStore.fetchAll())

function startEdit(d: DiceWithRewardCount) {
  editingDice.value = d
  showForm.value = true
}

function startDelete(d: DiceWithRewardCount) {
  deletingDice.value = d
}

function closeForm() {
  showForm.value = false
  editingDice.value = null
}

function onSaved() {
  closeForm()
  diceStore.fetchAll()
}

async function confirmDelete() {
  if (!deletingDice.value) return
  await diceStore.remove(deletingDice.value.dice_id)
  deletingDice.value = null
}
</script>
