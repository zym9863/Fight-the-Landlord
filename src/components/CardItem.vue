<script setup lang="ts">
import type { Card } from '../types/card'

const props = withDefaults(
  defineProps<{
    card: Card
    faceDown?: boolean
    selected?: boolean
    clickable?: boolean
  }>(),
  {
    faceDown: false,
    selected: false,
    clickable: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

function onClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div
    class="card-item"
    :class="{ selected, clickable, 'face-down': faceDown }"
    @click="onClick"
  >
    <template v-if="!faceDown">
      <div class="card-rank" :class="card.color">{{ card.display }}</div>
      <div class="card-suit" :class="card.color">{{ card.suitSymbol }}</div>
    </template>
    <template v-else>
      <div class="card-back">🂠</div>
    </template>
  </div>
</template>

<style scoped>
.card-item {
  width: 60px;
  height: 90px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
  flex-shrink: 0;
}

.card-item.selected {
  transform: translateY(-20px);
}

.card-item.clickable {
  cursor: pointer;
}

.card-item.clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-item.face-down {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  border-color: #1a252f;
}

.card-rank {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 14px;
  font-weight: bold;
}

.card-suit {
  font-size: 24px;
}

.red {
  color: #e74c3c;
}

.black {
  color: #2c3e50;
}

.card-back {
  font-size: 32px;
  color: #95a5a6;
}
</style>
