<script setup lang="ts">
import { useGameStore } from './stores/game'
import GameBoard from './components/GameBoard.vue'

const store = useGameStore()
</script>

<template>
  <div class="app">
    <template v-if="store.phase === 'waiting'">
      <div class="start-screen">
        <h1 class="title">斗地主</h1>
        <p class="subtitle">单机版 · 高级AI对战</p>
        <button class="start-btn" @click="store.startGame()">开始游戏</button>
      </div>
    </template>
    <template v-else>
      <GameBoard />
    </template>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #1a5c2e 0%, #0d3318 100%);
}
.title {
  font-size: 72px;
  color: #f39c12;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 16px;
}
.subtitle {
  color: #ecf0f1;
  font-size: 18px;
  margin-bottom: 48px;
}
.start-btn {
  background: linear-gradient(to bottom, #f39c12, #e67e22);
  color: #2c3e50;
  border: none;
  padding: 16px 48px;
  font-size: 24px;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}
.start-btn:hover {
  transform: scale(1.05);
}
</style>
