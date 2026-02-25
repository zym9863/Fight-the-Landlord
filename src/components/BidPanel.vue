<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="bid-panel">
    <div class="bid-message">{{ store.message }}</div>
    <div
      v-if="store.currentBidder === 0 && !store.bidPassed[0]"
      class="bid-buttons"
    >
      <button class="bid-btn bid-yes" @click="store.playerBid(true)">
        叫地主
      </button>
      <button class="bid-btn bid-no" @click="store.playerBid(false)">
        不叫
      </button>
    </div>
  </div>
</template>

<style scoped>
.bid-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30;
  background: var(--color-panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 40px 64px;
  border-radius: var(--radius-panel);
  border: 1px solid var(--color-panel-border);
  box-shadow: var(--shadow-panel), inset 0 0 0 1px rgba(255,255,255,0.05);
  animation: panel-appear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes panel-appear {
  from { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.bid-message {
  color: var(--color-gold);
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
}

.bid-buttons {
  display: flex;
  gap: 24px;
}

.bid-btn {
  padding: 14px 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-btn);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.bid-btn::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.bid-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.bid-btn:active {
  transform: translateY(1px);
}

.bid-yes {
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
  color: var(--color-bg-dark);
  border-color: rgba(255, 255, 255, 0.3);
}

.bid-yes:hover {
  background: linear-gradient(135deg, var(--color-gold-light), var(--color-gold));
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
}

.bid-no {
  background: linear-gradient(135deg, #4A5568, #2D3748);
  color: var(--color-text-main);
}

.bid-no:hover {
  background: linear-gradient(135deg, #718096, #4A5568);
}
</style>
