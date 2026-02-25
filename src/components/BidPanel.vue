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
  gap: 16px;
}

.bid-message {
  color: #ecf0f1;
  font-size: 18px;
  text-align: center;
}

.bid-buttons {
  display: flex;
  gap: 16px;
}

.bid-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.bid-btn:hover {
  transform: scale(1.05);
}

.bid-btn:active {
  transform: scale(0.98);
}

.bid-yes {
  background-color: #f39c12;
  color: #2c3e50;
}

.bid-yes:hover {
  background-color: #f5b041;
}

.bid-no {
  background-color: #7f8c8d;
  color: #ecf0f1;
}

.bid-no:hover {
  background-color: #95a5a6;
}
</style>
