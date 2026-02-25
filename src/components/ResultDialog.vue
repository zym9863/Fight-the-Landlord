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
  background: rgba(5, 24, 16, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-dialog {
  background: linear-gradient(135deg, var(--color-bg-light), var(--color-bg-dark));
  border-radius: var(--radius-panel);
  padding: 64px 80px;
  min-width: 400px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(212, 175, 55, 0.3);
  position: relative;
  overflow: hidden;
  animation: dialog-appear 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.result-dialog::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  z-index: 0;
  opacity: 0.5;
}

@keyframes dialog-appear {
  from { opacity: 0; transform: scale(0.8) translateY(40px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.result-dialog > * {
  position: relative;
  z-index: 1;
}

.result-title {
  font-family: var(--font-serif);
  font-size: 64px;
  font-weight: 900;
  margin-bottom: 16px;
  letter-spacing: 8px;
  text-shadow: 0 4px 16px rgba(0,0,0,0.6);
}

.result-title.win {
  background: linear-gradient(to bottom, #FFF5C3, var(--color-gold), var(--color-gold-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.4));
}

.result-title.lose {
  background: linear-gradient(to bottom, #FFB3B3, var(--color-crimson), #8B0000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(196, 30, 58, 0.4));
}

.result-subtitle {
  font-family: var(--font-sans);
  font-size: 24px;
  color: var(--color-text-main);
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.result-multiplier {
  font-family: var(--font-display);
  font-size: 32px;
  color: var(--color-gold);
  margin-bottom: 48px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.play-again-btn {
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
  color: var(--color-bg-dark);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 18px 56px;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 4px;
  border-radius: var(--radius-btn);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.play-again-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.6s ease-out;
}

.play-again-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.play-again-btn:hover::after {
  transform: rotate(45deg) translateX(100%);
}

.play-again-btn:active {
  transform: translateY(2px) scale(0.98);
}
</style>
