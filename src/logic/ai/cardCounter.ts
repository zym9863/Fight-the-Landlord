// src/logic/ai/cardCounter.ts
// AI Card Counter - tracks played cards and estimates remaining cards

import type { Card } from '../../types/card'
import { countByRank } from '../cardType'

export class CardCounter {
  private totalCounts: Map<number, number>
  private playedCards: Card[] = []
  private playedCounts: Map<number, number> = new Map()

  constructor() {
    // Standard deck: ranks 3-15 have 4 cards each, rank 16 (small joker) and 17 (big joker) have 1 each
    this.totalCounts = new Map()
    for (let r = 3; r <= 15; r++) this.totalCounts.set(r, 4)
    this.totalCounts.set(16, 1)
    this.totalCounts.set(17, 1)
  }

  reset(): void {
    this.playedCards = []
    this.playedCounts = new Map()
  }

  recordPlay(cards: Card[]): void {
    for (const c of cards) {
      this.playedCards.push(c)
      this.playedCounts.set(c.rank, (this.playedCounts.get(c.rank) || 0) + 1)
    }
  }

  getRemainingCount(rank: number): number {
    return (this.totalCounts.get(rank) || 0) - (this.playedCounts.get(rank) || 0)
  }

  getTotalRemaining(): number {
    let total = 0
    for (const [rank] of this.totalCounts) {
      total += this.getRemainingCount(rank)
    }
    return total
  }

  isRankExhausted(rank: number): boolean {
    return this.getRemainingCount(rank) === 0
  }

  /** Estimate how many potential bombs opponents might hold */
  getPossibleBombCount(myCards: Card[]): number {
    const myCounts = countByRank(myCards)
    let bombCount = 0
    for (let r = 3; r <= 15; r++) {
      const remaining = this.getRemainingCount(r)
      const myCount = myCounts.get(r) || 0
      const othersHave = remaining - myCount
      if (othersHave === 4) bombCount++
    }
    return bombCount
  }
}
