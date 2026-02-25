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
  min-height: 100px;
}

.pass-text {
  font-size: 24px;
  color: #ecf0f1;
  opacity: 0.8;
  font-weight: bold;
}

.cards-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
</style>
