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
  background: transparent; /* Background is handled by body */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.game-board::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.board-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.top-player {
  display: flex;
  justify-content: center;
  margin-bottom: auto;
  padding-top: 24px;
}

.middle-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 48px;
  width: 100%;
  flex: 1;
}

.left-player {
  flex-shrink: 0;
  padding-left: 48px;
}

.play-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  max-width: 800px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.bottom-player {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-bottom: 24px;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
  position: absolute;
  bottom: 160px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.btn {
  padding: 12px 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-btn);
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-dark));
  color: var(--color-bg-dark);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-gold-light), var(--color-gold));
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #4A5568, #2D3748);
  color: var(--color-text-main);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #718096, #4A5568);
}

.btn-hint {
  background: linear-gradient(135deg, #2B6CB0, #2C5282);
  color: var(--color-text-main);
}

.btn-hint:hover {
  background: linear-gradient(135deg, #4299E1, #2B6CB0);
}
</style>
