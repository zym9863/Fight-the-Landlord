export type Suit = 'spade' | 'heart' | 'club' | 'diamond'

export interface Card {
  id: number
  suit: Suit | 'joker'
  rank: number        // 3=3,...,13=K,14=A,15=2,16=小王,17=大王
  display: string     // "3","4",...,"J","Q","K","A","2","小王","大王"
  suitSymbol: string  // "♠","♥","♣","♦","🃏","👑"
  color: 'red' | 'black'
}

export enum CardType {
  SINGLE = 'SINGLE',
  PAIR = 'PAIR',
  TRIPLE = 'TRIPLE',
  TRIPLE_WITH_SINGLE = 'TRIPLE_WITH_SINGLE',
  TRIPLE_WITH_PAIR = 'TRIPLE_WITH_PAIR',
  SEQUENCE = 'SEQUENCE',
  SEQUENCE_PAIR = 'SEQUENCE_PAIR',
  SEQUENCE_TRIPLE = 'SEQUENCE_TRIPLE',
  PLANE_WITH_SINGLES = 'PLANE_WITH_SINGLES',
  PLANE_WITH_PAIRS = 'PLANE_WITH_PAIRS',
  FOUR_WITH_TWO_SINGLES = 'FOUR_WITH_TWO_SINGLES',
  FOUR_WITH_TWO_PAIRS = 'FOUR_WITH_TWO_PAIRS',
  BOMB = 'BOMB',
  ROCKET = 'ROCKET',
}

export interface CardPlay {
  type: CardType
  cards: Card[]
  mainRank: number
  length?: number
}

export interface PlayerState {
  cards: Card[]
  isLandlord: boolean
  name: string
  isAI: boolean
}

export type GamePhase = 'waiting' | 'dealing' | 'bidding' | 'playing' | 'result'

export interface TurnRecord {
  playerIndex: number
  play: CardPlay | null
}
