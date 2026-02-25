// src/stores/game.ts
// Central game state manager - orchestrates the entire Dou Di Zhu game flow

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Card, CardPlay, PlayerState, GamePhase, TurnRecord } from '../types/card'
import { CardType } from '../types/card'
import { deal, sortCards } from '../logic/deck'
import { identifyCardType, findValidPlays } from '../logic/cardType'
import { canBeat } from '../logic/compare'
import { CardCounter, PlayDecider } from '../logic/ai/index'

export const useGameStore = defineStore('game', () => {
  // ─── State ────────────────────────────────────────────────────────────
  const phase = ref<GamePhase>('waiting')
  const players = ref<PlayerState[]>([
    { cards: [], isLandlord: false, name: '你', isAI: false },
    { cards: [], isLandlord: false, name: 'AI-1', isAI: true },
    { cards: [], isLandlord: false, name: 'AI-2', isAI: true },
  ])
  const landlordIndex = ref(-1)
  const currentPlayerIndex = ref(0)
  const landlordCards = ref<Card[]>([])
  const lastPlay = ref<{ play: CardPlay; playerIndex: number } | null>(null)
  const passCount = ref(0)
  const turnHistory = ref<TurnRecord[]>([])
  const bombCount = ref(0)
  const winner = ref<'landlord' | 'farmer' | null>(null)
  const selectedCards = ref<Set<number>>(new Set())
  const hintIndex = ref(-1)
  const hintPlays = ref<CardPlay[]>([])
  const currentBidder = ref(0)
  const bidPassed = ref<boolean[]>([false, false, false])
  const showLandlordCards = ref(false)
  const message = ref('')

  // ─── AI Engine (plain instances, not reactive) ────────────────────────
  const counter = new CardCounter()
  const decider = new PlayDecider(counter)

  // ─── Computed ─────────────────────────────────────────────────────────
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const isPlayerTurn = computed(
    () => currentPlayerIndex.value === 0 && phase.value === 'playing',
  )
  const playerCards = computed(() => players.value[0].cards)

  // ─── Methods ──────────────────────────────────────────────────────────

  /** Start a new game: reset all state, deal cards, begin bidding */
  function startGame(): void {
    // Reset all state
    phase.value = 'waiting'
    landlordIndex.value = -1
    currentPlayerIndex.value = 0
    lastPlay.value = null
    passCount.value = 0
    turnHistory.value = []
    bombCount.value = 0
    winner.value = null
    selectedCards.value = new Set()
    hintIndex.value = -1
    hintPlays.value = []
    currentBidder.value = 0
    bidPassed.value = [false, false, false]
    showLandlordCards.value = false
    message.value = ''
    counter.reset()

    // Deal cards
    const { hands, landlordCards: lCards } = deal()
    players.value[0].cards = hands[0]
    players.value[1].cards = hands[1]
    players.value[2].cards = hands[2]
    players.value[0].isLandlord = false
    players.value[1].isLandlord = false
    players.value[2].isLandlord = false
    landlordCards.value = lCards

    // Randomly pick first bidder (0-2)
    currentBidder.value = Math.floor(Math.random() * 3)

    // Set phase to dealing, then after 500ms switch to bidding
    phase.value = 'dealing'
    setTimeout(() => {
      phase.value = 'bidding'
      processBidding()
    }, 500)
  }

  /** Handle the bidding phase */
  function processBidding(): void {
    // Check if all bidders have passed
    if (bidPassed.value.every((p) => p)) {
      message.value = '没人叫地主，重新发牌'
      setTimeout(() => {
        startGame()
      }, 1500)
      return
    }

    // Skip bidders who already passed
    while (bidPassed.value[currentBidder.value]) {
      currentBidder.value = (currentBidder.value + 1) % 3
    }

    // Check if only one bidder remains
    const remainingBidders = bidPassed.value.filter((p) => !p).length
    if (remainingBidders === 1) {
      // Auto-assign the remaining bidder as landlord
      const idx = bidPassed.value.findIndex((p) => !p)
      setLandlord(idx)
      return
    }

    // AI bidding
    if (currentBidder.value !== 0) {
      const aiIdx = currentBidder.value
      setTimeout(() => {
        const shouldBid = decider.decideBid(players.value[aiIdx].cards)
        if (shouldBid) {
          message.value = `${players.value[aiIdx].name} 叫地主！`
          setLandlord(aiIdx)
        } else {
          message.value = `${players.value[aiIdx].name} 不叫`
          bidPassed.value[aiIdx] = true
          currentBidder.value = (currentBidder.value + 1) % 3
          processBidding()
        }
      }, 1000)
    }
    // For human (index 0): wait for UI to call playerBid()
  }

  /** Human player's bid decision */
  function playerBid(bid: boolean): void {
    if (bid) {
      message.value = '你叫地主！'
      setLandlord(0)
    } else {
      message.value = '你不叫'
      bidPassed.value[0] = true
      currentBidder.value = (currentBidder.value + 1) % 3
      processBidding()
    }
  }

  /** Set landlord: add landlord cards to their hand, sort, show landlord cards */
  function setLandlord(idx: number): void {
    landlordIndex.value = idx
    players.value[idx].isLandlord = true

    // Add landlord cards to their hand
    players.value[idx].cards = sortCards([
      ...players.value[idx].cards,
      ...landlordCards.value,
    ])

    showLandlordCards.value = true
    message.value = `${players.value[idx].name} 是地主`

    // After 1500ms, switch to playing phase
    setTimeout(() => {
      phase.value = 'playing'
      currentPlayerIndex.value = idx
      showLandlordCards.value = true
      message.value = ''

      // If the landlord is an AI, trigger AI turn
      if (players.value[idx].isAI) {
        processAITurn()
      }
    }, 1500)
  }

  /** AI's turn: decide what to play */
  function processAITurn(): void {
    setTimeout(() => {
      const aiIdx = currentPlayerIndex.value
      const hand = players.value[aiIdx].cards
      const activeLastPlay =
        lastPlay.value && lastPlay.value.playerIndex !== aiIdx
          ? lastPlay.value.play
          : null

      const play = decider.decide(
        hand,
        activeLastPlay,
        lastPlay.value?.playerIndex ?? aiIdx,
        aiIdx,
        landlordIndex.value,
        players.value,
      )

      if (play) {
        executePlay(aiIdx, play)
      } else {
        executePass(aiIdx)
      }
    }, 1000)
  }

  /** Execute a play: remove cards from hand, record, check win */
  function executePlay(playerIdx: number, play: CardPlay): void {
    // Remove played cards from hand
    const playedIds = new Set(play.cards.map((c) => c.id))
    players.value[playerIdx].cards = players.value[playerIdx].cards.filter(
      (c) => !playedIds.has(c.id),
    )

    // Record in counter
    counter.recordPlay(play.cards)

    // Track bombs
    if (play.type === CardType.BOMB || play.type === CardType.ROCKET) {
      bombCount.value++
    }

    // Update lastPlay
    lastPlay.value = { play, playerIndex: playerIdx }

    // Reset pass count
    passCount.value = 0

    // Record in turn history
    turnHistory.value.push({ playerIndex: playerIdx, play })

    // Update message
    const cardNames = play.cards.map((c) => c.suitSymbol + c.display).join(' ')
    message.value = `${players.value[playerIdx].name}: ${cardNames}`

    // Check win condition
    if (players.value[playerIdx].cards.length === 0) {
      endGame(playerIdx)
      return
    }

    // Next turn
    nextTurn()
  }

  /** Execute a pass */
  function executePass(playerIdx: number): void {
    passCount.value++

    // Record in turn history
    turnHistory.value.push({ playerIndex: playerIdx, play: null })

    // Update message
    message.value = `${players.value[playerIdx].name}: 不出`

    // If passCount >= 2, the current player gets a free play (reset lastPlay)
    if (passCount.value >= 2) {
      lastPlay.value = null
      passCount.value = 0
    }

    // Next turn
    nextTurn()
  }

  /** Move to next player */
  function nextTurn(): void {
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % 3

    // Reset selection state when it becomes human player's turn
    if (currentPlayerIndex.value === 0) {
      selectedCards.value = new Set()
      hintIndex.value = -1
      hintPlays.value = []
    }

    setTimeout(() => {
      if (players.value[currentPlayerIndex.value].isAI) {
        processAITurn()
      }
    }, 800)
  }

  /** Validate and execute human player's selected cards */
  function playerPlay(): boolean {
    // Get selected cards from hand
    const hand = players.value[0].cards
    const selected = hand.filter((c) => selectedCards.value.has(c.id))

    if (selected.length === 0) {
      message.value = '请选择要出的牌'
      return false
    }

    // Identify card type
    const play = identifyCardType(selected)
    if (!play) {
      message.value = '无效牌型'
      return false
    }

    // If there's a lastPlay from another player, check if we can beat it
    if (lastPlay.value && lastPlay.value.playerIndex !== 0) {
      if (!canBeat(play, lastPlay.value.play)) {
        message.value = '打不过上家'
        return false
      }
    }

    // Execute play
    selectedCards.value = new Set()
    hintIndex.value = -1
    hintPlays.value = []
    executePlay(0, play)
    return true
  }

  /** Human pass */
  function playerPass(): boolean {
    // Can't pass if you must lead (no lastPlay or lastPlay is yours)
    if (!lastPlay.value || lastPlay.value.playerIndex === 0) {
      message.value = '你必须出牌'
      return false
    }

    selectedCards.value = new Set()
    hintIndex.value = -1
    hintPlays.value = []
    executePass(0)
    return true
  }

  /** Find valid plays, cycle through them, set selectedCards */
  function showHint(): void {
    if (!isPlayerTurn.value) return

    // Build hint plays list if empty or hint was reset
    if (hintPlays.value.length === 0) {
      const hand = players.value[0].cards
      const activeLastPlay =
        lastPlay.value && lastPlay.value.playerIndex !== 0
          ? lastPlay.value.play
          : null
      hintPlays.value = findValidPlays(hand, activeLastPlay)
    }

    if (hintPlays.value.length === 0) {
      message.value = '没有可出的牌'
      return
    }

    // Cycle through hint plays
    hintIndex.value = (hintIndex.value + 1) % hintPlays.value.length
    const hintPlay = hintPlays.value[hintIndex.value]

    // Set selected cards to match the hint
    selectedCards.value = new Set(hintPlay.cards.map((c) => c.id))
  }

  /** Toggle card selection, reset hint state */
  function toggleCard(cardId: number): void {
    const newSet = new Set(selectedCards.value)
    if (newSet.has(cardId)) {
      newSet.delete(cardId)
    } else {
      newSet.add(cardId)
    }
    selectedCards.value = newSet

    // Reset hint state when manually selecting
    hintIndex.value = -1
    hintPlays.value = []
  }

  /** End game: set phase to result, determine winner */
  function endGame(winnerIdx: number): void {
    phase.value = 'result'

    // Determine if landlord or farmer won
    if (winnerIdx === landlordIndex.value) {
      winner.value = 'landlord'
    } else {
      winner.value = 'farmer'
    }

    // Calculate multiplier (2^bombCount)
    const multiplier = Math.pow(2, bombCount.value)
    message.value =
      winner.value === 'landlord'
        ? `地主胜！倍数: ${multiplier}`
        : `农民胜！倍数: ${multiplier}`
  }

  // ─── Return all state, computed, and methods ──────────────────────────
  return {
    // State
    phase,
    players,
    landlordIndex,
    currentPlayerIndex,
    landlordCards,
    lastPlay,
    passCount,
    turnHistory,
    bombCount,
    winner,
    selectedCards,
    hintIndex,
    hintPlays,
    currentBidder,
    bidPassed,
    showLandlordCards,
    message,

    // Computed
    currentPlayer,
    isPlayerTurn,
    playerCards,

    // Methods
    startGame,
    processBidding,
    playerBid,
    setLandlord,
    processAITurn,
    executePlay,
    executePass,
    nextTurn,
    playerPlay,
    playerPass,
    showHint,
    toggleCard,
    endGame,
  }
})
