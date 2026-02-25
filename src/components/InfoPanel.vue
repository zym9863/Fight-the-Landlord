<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import CardItem from './CardItem.vue'

const store = useGameStore()

const multiplier = computed(() => Math.pow(2, store.bombCount))
</script>

<template>
  <div class="info-panel">
    <div class="landlord-cards">
      <div class="landlord-cards-label">底牌</div>
      <div class="landlord-cards-row">
        <div
          v-for="card in store.landlordCards"
          :key="card.id"
          class="landlord-card-wrapper"
        >
          <CardItem
            :card="card"
            :face-down="!store.showLandlordCards"
          />
        </div>
      </div>
    </div>
    <div class="game-info">
      <span class="info-item">阶段: {{ store.phase }}</span>
      <span class="info-item">炸弹: {{ store.bombCount }} ({{ multiplier }}倍)</span>
      <span v-if="store.message" class="info-item info-message">{{ store.message }}</span>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
}

.landlord-cards {
  display: flex;
  align-items: center;
  gap: 8px;
}

.landlord-cards-label {
  color: #ecf0f1;
  font-size: 13px;
  white-space: nowrap;
}

.landlord-cards-row {
  display: flex;
  gap: 4px;
}

.landlord-card-wrapper {
  transform: scale(0.7);
  transform-origin: center;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-item {
  color: #ecf0f1;
  font-size: 13px;
  white-space: nowrap;
}

.info-message {
  color: #f1c40f;
}
</style>
