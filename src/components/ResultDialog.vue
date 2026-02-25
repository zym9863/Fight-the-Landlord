<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const multiplier = computed(() => Math.pow(2, store.bombCount))

const isPlayerLandlord = computed(() => store.landlordIndex === 0)

const playerWon = computed(() => {
  if (!store.winner) return false
  if (store.winner === 'landlord') return isPlayerLandlord.value
  return !isPlayerLandlord.value
})

const resultTitle = computed(() => {
  if (playerWon.value) return '你赢了！'
  return '你输了！'
})

const resultSubtitle = computed(() => {
  if (store.winner === 'landlord') return '地主赢了！'
  return '农民赢了！'
})
</script>

<template>
  <div class="result-overlay">
    <div class="result-dialog">
      <h2 class="result-title" :class="{ win: playerWon, lose: !playerWon }">
        {{ resultTitle }}
      </h2>
      <p class="result-subtitle">{{ resultSubtitle }}</p>
      <p class="result-multiplier">倍率: x{{ multiplier }}</p>
      <button class="play-again-btn" @click="store.startGame()">再来一局</button>
    </div>
  </div>
</template>

<style scoped>
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 40px 48px;
  min-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.result-title {
  font-size: 36px;
  margin-bottom: 8px;
}

.result-title.win {
  color: #f39c12;
}

.result-title.lose {
  color: #e74c3c;
}

.result-subtitle {
  font-size: 18px;
  color: #555;
  margin-bottom: 12px;
}

.result-multiplier {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 24px;
}

.play-again-btn {
  background: linear-gradient(to bottom, #f39c12, #e67e22);
  color: #2c3e50;
  border: none;
  padding: 14px 40px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.play-again-btn:hover {
  transform: scale(1.05);
}
</style>
