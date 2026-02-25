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
  justify-content: space-between;
  gap: 32px;
  padding: 12px 32px;
  background: var(--color-panel-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-panel-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
}

.landlord-cards {
  display: flex;
  align-items: center;
  gap: 16px;
}

.landlord-cards-label {
  color: var(--color-gold);
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
  text-transform: uppercase;
}

.landlord-cards-row {
  display: flex;
  gap: -10px;
}

.landlord-card-wrapper {
  transform: scale(0.6);
  transform-origin: center left;
  margin-right: -20px;
  transition: transform 0.3s ease;
}

.landlord-card-wrapper:hover {
  transform: scale(0.7) translateY(-10px);
  z-index: 10;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 32px;
}

.info-item {
  color: var(--color-text-main);
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--color-gold);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--color-gold);
}

.info-message {
  color: var(--color-gold-light);
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  animation: pulse 2s infinite;
}

.info-message::before {
  display: none;
}

@keyframes pulse {
  0% { opacity: 0.7; text-shadow: 0 0 4px rgba(241, 196, 15, 0.2); }
  50% { opacity: 1; text-shadow: 0 0 12px rgba(241, 196, 15, 0.6); }
  100% { opacity: 0.7; text-shadow: 0 0 4px rgba(241, 196, 15, 0.2); }
}
</style>
