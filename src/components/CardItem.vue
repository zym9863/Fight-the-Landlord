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
  width: 72px;
  height: 108px;
  background: var(--color-card-bg);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-card-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  user-select: none;
  flex-shrink: 0;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%);
  pointer-events: none;
}

.card-item.selected {
  transform: translateY(-24px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-gold);
}

.card-item.clickable {
  cursor: pointer;
}

.card-item.clickable:hover:not(.selected) {
  transform: translateY(-12px);
  box-shadow: var(--shadow-card-hover);
}

.card-item.face-down {
  background: linear-gradient(135deg, var(--color-crimson) 0%, #8B0000 100%);
  border-color: #5A0000;
  box-shadow: inset 0 0 0 4px rgba(212, 175, 55, 0.3), var(--shadow-card);
}

.card-item.face-down::after {
  content: '';
  position: absolute;
  top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(212, 175, 55, 0.5);
  border-radius: 6px;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(212, 175, 55, 0.1) 4px, rgba(212, 175, 55, 0.1) 8px);
}

.card-rank {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
}

.card-suit {
  font-size: 32px;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}

.red {
  color: var(--color-crimson);
}

.black {
  color: #1A1A1A;
}

.card-back {
  font-family: var(--font-serif);
  font-size: 24px;
  color: var(--color-gold);
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  z-index: 2;
}
</style>
