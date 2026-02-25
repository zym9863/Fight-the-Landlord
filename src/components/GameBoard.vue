<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import type { PlayerState } from '../types/card'
import InfoPanel from './InfoPanel.vue'
import PlayerHand from './PlayerHand.vue'
import PlayedCards from './PlayedCards.vue'
import BidPanel from './BidPanel.vue'
import ResultDialog from './ResultDialog.vue'

const store = useGameStore()
const fallbackPlayer: PlayerState = {
  cards: [],
  isLandlord: false,
  name: '',
  isAI: true,
}

// Keep the table display focused on the latest actual card play (ignore passes).
const lastNonPassTurn = computed(() => {
  for (let i = store.turnHistory.length - 1; i >= 0; i--) {
    const turn = store.turnHistory[i]
    if (turn && turn.play !== null) return turn
  }
  return null
})

const lastPlayedCards = computed(() => {
  const turn = lastNonPassTurn.value
  if (!turn || !turn.play) return []
  return turn.play.cards
})

const lastPlayerName = computed(() => {
  const turn = lastNonPassTurn.value
  if (!turn) return ''
  return store.players[turn.playerIndex]?.name ?? ''
})

const lastIsPass = computed(() => false)
const topPlayer = computed(() => store.players[2] ?? fallbackPlayer)
const leftPlayer = computed(() => store.players[1] ?? fallbackPlayer)
const bottomPlayer = computed(() => store.players[0] ?? fallbackPlayer)

const showActionButtons = computed(
  () => store.isPlayerTurn && store.phase === 'playing',
)
</script>

<template>
  <div class="game-board">
    <InfoPanel />

    <div class="board-center">
      <div class="top-player">
        <PlayerHand :player="topPlayer" position="top" />
      </div>

      <div class="middle-row">
        <div class="left-player">
          <PlayerHand :player="leftPlayer" position="left" />
        </div>

        <div class="play-area">
          <PlayedCards
            :cards="lastPlayedCards"
            :player-name="lastPlayerName"
            :is-pass="lastIsPass"
          />
        </div>
      </div>

      <BidPanel v-if="store.phase === 'bidding'" />

      <div class="bottom-player">
        <PlayerHand
          :player="bottomPlayer"
          position="bottom"
          :selected-cards="store.selectedCards"
          :interactive="store.isPlayerTurn"
          @card-click="store.toggleCard"
        />
      </div>

      <div v-if="showActionButtons" class="action-buttons">
        <button class="btn btn-primary" @click="store.playerPlay()">出牌</button>
        <button class="btn btn-secondary" @click="store.playerPass()">不出</button>
        <button class="btn btn-hint" @click="store.showHint()">提示</button>
      </div>
    </div>

    <ResultDialog v-if="store.phase === 'result'" />
  </div>
</template>

<style scoped>
.game-board {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at center, #1a5c2e 0%, #0d3318 70%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
}

.top-player {
  display: flex;
  justify-content: center;
}

.middle-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
}

.left-player {
  flex-shrink: 0;
}

.play-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-width: 600px;
}

.bottom-player {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}

.btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.btn:hover {
  transform: scale(1.05);
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: linear-gradient(to bottom, #f39c12, #e67e22);
  color: #2c3e50;
}

.btn-primary:hover {
  background: linear-gradient(to bottom, #f5b041, #f39c12);
}

.btn-secondary {
  background-color: #7f8c8d;
  color: #ecf0f1;
}

.btn-secondary:hover {
  background-color: #95a5a6;
}

.btn-hint {
  background-color: #3498db;
  color: #fff;
}

.btn-hint:hover {
  background-color: #5dade2;
}
</style>
