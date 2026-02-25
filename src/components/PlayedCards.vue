<script setup lang="ts">
import type { Card } from '../types/card'
import CardItem from './CardItem.vue'

withDefaults(
  defineProps<{
    cards: Card[]
    playerName: string
    isPass?: boolean
  }>(),
  {
    isPass: false,
  },
)
</script>

<template>
  <div class="played-cards">
    <template v-if="isPass">
      <div class="pass-text">不出</div>
    </template>
    <template v-else-if="cards.length > 0">
      <div class="cards-row">
        <CardItem v-for="card in cards" :key="card.id" :card="card" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.played-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  position: relative;
  perspective: 1000px;
}

.pass-text {
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 900;
  color: var(--color-text-muted);
  letter-spacing: 8px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  opacity: 0.6;
  transform: scale(0.9);
  animation: pass-appear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes pass-appear {
  to {
    opacity: 0.9;
    transform: scale(1);
  }
}

.cards-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: -20px; /* Negative gap for overlap */
  transform-style: preserve-3d;
  animation: cards-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.cards-row > * {
  margin-left: -30px;
  box-shadow: -4px 4px 12px rgba(0,0,0,0.3);
}

.cards-row > *:first-child {
  margin-left: 0;
}

@keyframes cards-appear {
  from {
    opacity: 0;
    transform: translateY(20px) rotateX(20deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}
</style>
