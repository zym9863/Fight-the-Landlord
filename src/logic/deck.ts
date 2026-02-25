// src/logic/deck.ts
import type { Card, Suit } from '../types/card'

const SUITS: Suit[] = ['spade', 'heart', 'club', 'diamond']
const SUIT_SYMBOLS: Record<Suit | 'joker', string> = {
  spade: '♠', heart: '♥', club: '♣', diamond: '♦', joker: ''
}
const RANK_DISPLAY: Record<number, string> = {
  3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王'
}

/** 创建一副完整的54张牌 */
export function createDeck(): Card[] {
  const cards: Card[] = []
  let id = 0
  for (const suit of SUITS) {
    for (let rank = 3; rank <= 15; rank++) {
      cards.push({
        id: id++,
        suit,
        rank,
        display: RANK_DISPLAY[rank],
        suitSymbol: SUIT_SYMBOLS[suit],
        color: suit === 'heart' || suit === 'diamond' ? 'red' : 'black',
      })
    }
  }
  // 小王
  cards.push({
    id: 52, suit: 'joker', rank: 16,
    display: '小王', suitSymbol: '🃏', color: 'black',
  })
  // 大王
  cards.push({
    id: 53, suit: 'joker', rank: 17,
    display: '大王', suitSymbol: '👑', color: 'red',
  })
  return cards
}

/** Fisher-Yates 洗牌 */
export function shuffle(cards: Card[]): Card[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 按rank排序（升序） */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.rank - b.rank || a.id - b.id)
}

/** 发牌：返回 [玩家1的17张, 玩家2的17张, 玩家3的17张, 底牌3张] */
export function deal(): { hands: [Card[], Card[], Card[]], landlordCards: Card[] } {
  const deck = shuffle(createDeck())
  return {
    hands: [
      sortCards(deck.slice(0, 17)),
      sortCards(deck.slice(17, 34)),
      sortCards(deck.slice(34, 51)),
    ],
    landlordCards: deck.slice(51, 54),
  }
}
