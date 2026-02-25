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
  position: relative;
}

.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: radial-gradient(circle at center, rgba(10, 46, 31, 0.8) 0%, rgba(5, 24, 16, 0.95) 100%);
  position: relative;
  z-index: 10;
}

.start-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  z-index: -1;
  opacity: 0.5;
}

.title {
  font-family: var(--font-serif);
  font-size: 96px;
  font-weight: 900;
  color: var(--color-gold);
  text-shadow: 0 4px 24px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 16px;
  letter-spacing: 8px;
  background: linear-gradient(to bottom, #FFF5C3, var(--color-gold), var(--color-gold-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: title-glow 3s ease-in-out infinite alternate;
}

@keyframes title-glow {
  0% { filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.2)); }
  100% { filter: drop-shadow(0 0 16px rgba(212, 175, 55, 0.6)); }
}

.subtitle {
  font-family: var(--font-sans);
  color: var(--color-text-muted);
  font-size: 20px;
  letter-spacing: 4px;
  margin-bottom: 64px;
  text-transform: uppercase;
  position: relative;
}

.subtitle::before, .subtitle::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px;
  height: 1px;
  background: var(--color-gold);
  opacity: 0.5;
}

.subtitle::before { left: -60px; }
.subtitle::after { right: -60px; }

.start-btn {
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
  color: var(--color-bg-dark);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 18px 64px;
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 4px;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.start-btn::after {
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

.start-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.start-btn:hover::after {
  transform: rotate(45deg) translateX(100%);
}

.start-btn:active {
  transform: translateY(2px) scale(0.98);
}
</style>
