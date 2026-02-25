// src/logic/ai/handAnalyzer.ts
// AI Hand Analyzer - decomposes a hand into optimal play groups using greedy strategy

import { CardType } from '../../types/card'
import type { Card, CardPlay } from '../../types/card'
import { countByRank } from '../cardType'

// ─── Types ───────────────────────────────────────────────────────────
export interface HandAnalysis {
  groups: CardPlay[]
  totalMoves: number
}

// ─── Helper: group cards by rank ─────────────────────────────────────
export function groupByRank(cards: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>()
  for (const c of cards) {
    const arr = groups.get(c.rank)
    if (arr) {
      arr.push(c)
    } else {
      groups.set(c.rank, [c])
    }
  }
  return groups
}

// ─── Helper: take N cards of a given rank from the remaining map ─────
function takeCards(remaining: Map<number, Card[]>, rank: number, count: number): Card[] {
  const group = remaining.get(rank)
  if (!group || group.length < count) return []
  const taken = group.splice(0, count)
  if (group.length === 0) {
    remaining.delete(rank)
  }
  return taken
}

// ─── Helper: get current count map from remaining ────────────────────
function getRemainingCounts(remaining: Map<number, Card[]>): Map<number, number> {
  const counts = new Map<number, number>()
  for (const [rank, cards] of remaining) {
    if (cards.length > 0) {
      counts.set(rank, cards.length)
    }
  }
  return counts
}

// ─── Helper: find longest consecutive run of ranks with minCount ─────
// Returns array of ranks in the best (longest) run, or empty if none qualifies.
// Only considers ranks 3-14.
function findBestConsecutiveRun(
  counts: Map<number, number>,
  minCount: number,
  minLength: number,
): number[] {
  // Collect qualifying ranks in 3-14 range
  const qualifyingRanks: number[] = []
  for (let r = 3; r <= 14; r++) {
    if ((counts.get(r) ?? 0) >= minCount) {
      qualifyingRanks.push(r)
    }
  }

  // Find the longest consecutive run
  let bestRun: number[] = []
  let currentRun: number[] = []

  for (const rank of qualifyingRanks) {
    if (currentRun.length === 0 || rank === currentRun[currentRun.length - 1] + 1) {
      currentRun.push(rank)
    } else {
      if (currentRun.length > bestRun.length) {
        bestRun = currentRun
      }
      currentRun = [rank]
    }
  }
  if (currentRun.length > bestRun.length) {
    bestRun = currentRun
  }

  if (bestRun.length >= minLength) {
    return bestRun
  }
  return []
}

// ═══════════════════════════════════════════════════════════════════════
// analyzeHand - decompose hand into optimal play groups (greedy)
// ═══════════════════════════════════════════════════════════════════════
export function analyzeHand(cards: Card[]): HandAnalysis {
  const groups: CardPlay[] = []

  // Build a mutable map of remaining cards
  const remaining = new Map<number, Card[]>()
  for (const c of cards) {
    const arr = remaining.get(c.rank)
    if (arr) {
      arr.push(c)
    } else {
      remaining.set(c.rank, [c])
    }
  }

  // ── Step 1: Identify rockets (both jokers) ──────────────────────────
  const smallJoker = remaining.get(16)
  const bigJoker = remaining.get(17)
  if (smallJoker && smallJoker.length > 0 && bigJoker && bigJoker.length > 0) {
    const rocketCards = [
      ...takeCards(remaining, 16, 1),
      ...takeCards(remaining, 17, 1),
    ]
    groups.push({
      type: CardType.ROCKET,
      cards: rocketCards,
      mainRank: 17,
    })
  }

  // ── Step 2: Note bombs (4 of a kind) - keep them for later ─────────
  const bombRanks: number[] = []
  for (const [rank, group] of remaining) {
    if (group.length === 4) {
      bombRanks.push(rank)
    }
  }

  // ── Step 3: Find planes (2+ consecutive triples, ranks 3-14) ───────
  // Temporarily exclude bomb ranks from triple detection to preserve bombs
  let planeFound = true
  while (planeFound) {
    planeFound = false
    const counts = getRemainingCounts(remaining)

    // Find ranks with count >= 3 in range 3-14, excluding 4-of-a-kind (bombs)
    const tripleRanks: number[] = []
    for (let r = 3; r <= 14; r++) {
      const cnt = counts.get(r) ?? 0
      if (cnt >= 3 && !bombRanks.includes(r)) {
        tripleRanks.push(r)
      }
    }

    // Find longest consecutive run of triple ranks
    let bestRun: number[] = []
    let currentRun: number[] = []
    for (const rank of tripleRanks) {
      if (currentRun.length === 0 || rank === currentRun[currentRun.length - 1] + 1) {
        currentRun.push(rank)
      } else {
        if (currentRun.length > bestRun.length) bestRun = currentRun
        currentRun = [rank]
      }
    }
    if (currentRun.length > bestRun.length) bestRun = currentRun

    if (bestRun.length >= 2) {
      planeFound = true

      // Extract the triple cards
      const planeCards: Card[] = []
      for (const rank of bestRun) {
        planeCards.push(...takeCards(remaining, rank, 3))
      }

      const planeLen = bestRun.length

      // Try to attach pairs first (带对)
      const pairCounts = getRemainingCounts(remaining)
      const availablePairRanks: number[] = []
      for (const [rank, cnt] of pairCounts) {
        if (cnt >= 2 && !bombRanks.includes(rank)) {
          availablePairRanks.push(rank)
        }
      }

      if (availablePairRanks.length >= planeLen) {
        // Attach pairs
        const wingCards: Card[] = []
        const pairsToUse = availablePairRanks.slice(0, planeLen)
        for (const pairRank of pairsToUse) {
          wingCards.push(...takeCards(remaining, pairRank, 2))
        }
        groups.push({
          type: CardType.PLANE_WITH_PAIRS,
          cards: [...planeCards, ...wingCards],
          mainRank: bestRun[0],
          length: planeLen,
        })
      } else {
        // Try to attach singles (带单)
        const singleCounts = getRemainingCounts(remaining)
        const availableSingleRanks: number[] = []
        for (const [rank, cnt] of singleCounts) {
          if (cnt >= 1 && !bombRanks.includes(rank)) {
            availableSingleRanks.push(rank)
          }
        }

        if (availableSingleRanks.length >= planeLen) {
          const wingCards: Card[] = []
          const singlesToUse = availableSingleRanks.slice(0, planeLen)
          for (const singleRank of singlesToUse) {
            wingCards.push(...takeCards(remaining, singleRank, 1))
          }
          groups.push({
            type: CardType.PLANE_WITH_SINGLES,
            cards: [...planeCards, ...wingCards],
            mainRank: bestRun[0],
            length: planeLen,
          })
        } else {
          // No wings available - bare plane (sequence of triples)
          groups.push({
            type: CardType.SEQUENCE_TRIPLE,
            cards: planeCards,
            mainRank: bestRun[0],
            length: planeLen,
          })
        }
      }
    }
  }

  // ── Step 4: Find sequences (5+ consecutive singles, ranks 3-14) ────
  let seqFound = true
  while (seqFound) {
    seqFound = false
    const counts = getRemainingCounts(remaining)
    const run = findBestConsecutiveRun(counts, 1, 5)

    if (run.length >= 5) {
      seqFound = true
      // Use the full run as a sequence
      // Only take 1 card per rank to form the sequence
      const seqCards: Card[] = []
      for (const rank of run) {
        seqCards.push(...takeCards(remaining, rank, 1))
      }
      groups.push({
        type: CardType.SEQUENCE,
        cards: seqCards,
        mainRank: run[0],
        length: run.length,
      })
    }
  }

  // ── Step 5: Find consecutive pairs (3+ consecutive pairs, ranks 3-14)
  let pairSeqFound = true
  while (pairSeqFound) {
    pairSeqFound = false
    const counts = getRemainingCounts(remaining)
    const run = findBestConsecutiveRun(counts, 2, 3)

    if (run.length >= 3) {
      pairSeqFound = true
      const pairCards: Card[] = []
      for (const rank of run) {
        pairCards.push(...takeCards(remaining, rank, 2))
      }
      groups.push({
        type: CardType.SEQUENCE_PAIR,
        cards: pairCards,
        mainRank: run[0],
        length: run.length,
      })
    }
  }

  // ── Step 6: Remaining triples → triple-with-pair or triple-with-single
  const tripleRanksLeft: number[] = []
  for (const [rank, group] of remaining) {
    if (group.length === 3 && !bombRanks.includes(rank)) {
      tripleRanksLeft.push(rank)
    }
  }
  // Sort triples by rank (ascending) for deterministic processing
  tripleRanksLeft.sort((a, b) => a - b)

  for (const tripleRank of tripleRanksLeft) {
    const tripleGroup = remaining.get(tripleRank)
    if (!tripleGroup || tripleGroup.length < 3) continue

    const tripleCards = takeCards(remaining, tripleRank, 3)

    // Try to find a pair to attach
    let attachedPair = false
    for (const [pairRank, pairGroup] of remaining) {
      if (pairGroup.length === 2 && !bombRanks.includes(pairRank)) {
        const pairCards = takeCards(remaining, pairRank, 2)
        groups.push({
          type: CardType.TRIPLE_WITH_PAIR,
          cards: [...tripleCards, ...pairCards],
          mainRank: tripleRank,
        })
        attachedPair = true
        break
      }
    }

    if (!attachedPair) {
      // Try to find a single to attach
      let attachedSingle = false
      for (const [singleRank, singleGroup] of remaining) {
        if (singleGroup.length >= 1 && !bombRanks.includes(singleRank)) {
          const singleCards = takeCards(remaining, singleRank, 1)
          groups.push({
            type: CardType.TRIPLE_WITH_SINGLE,
            cards: [...tripleCards, ...singleCards],
            mainRank: tripleRank,
          })
          attachedSingle = true
          break
        }
      }

      if (!attachedSingle) {
        // Bare triple
        groups.push({
          type: CardType.TRIPLE,
          cards: tripleCards,
          mainRank: tripleRank,
        })
      }
    }
  }

  // ── Step 7: Keep bombs intact ───────────────────────────────────────
  for (const bombRank of bombRanks) {
    const bombGroup = remaining.get(bombRank)
    if (bombGroup && bombGroup.length === 4) {
      const bombCards = takeCards(remaining, bombRank, 4)
      groups.push({
        type: CardType.BOMB,
        cards: bombCards,
        mainRank: bombRank,
      })
    }
  }

  // ── Step 8: Remaining pairs ─────────────────────────────────────────
  const pairRanksLeft: number[] = []
  for (const [rank, group] of remaining) {
    if (group.length === 2) {
      pairRanksLeft.push(rank)
    }
  }
  pairRanksLeft.sort((a, b) => a - b)

  for (const pairRank of pairRanksLeft) {
    const pairGroup = remaining.get(pairRank)
    if (pairGroup && pairGroup.length >= 2) {
      const pairCards = takeCards(remaining, pairRank, 2)
      groups.push({
        type: CardType.PAIR,
        cards: pairCards,
        mainRank: pairRank,
      })
    }
  }

  // ── Step 9: Remaining singles ───────────────────────────────────────
  const singleRanksLeft: number[] = []
  for (const [rank, group] of remaining) {
    if (group.length >= 1) {
      singleRanksLeft.push(rank)
    }
  }
  singleRanksLeft.sort((a, b) => a - b)

  for (const singleRank of singleRanksLeft) {
    const singleGroup = remaining.get(singleRank)
    if (singleGroup) {
      while (singleGroup.length > 0) {
        const singleCards = takeCards(remaining, singleRank, 1)
        if (singleCards.length > 0) {
          groups.push({
            type: CardType.SINGLE,
            cards: singleCards,
            mainRank: singleRank,
          })
        }
      }
    }
  }

  return {
    groups,
    totalMoves: groups.length,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// evaluateHand - evaluate hand strength (higher = stronger)
// ═══════════════════════════════════════════════════════════════════════
export function evaluateHand(cards: Card[]): number {
  const analysis = analyzeHand(cards)
  const rankCounts = countByRank(cards)

  let score = 100

  // Fewer total moves = stronger
  score -= analysis.totalMoves * 10

  // Bonus for powerful plays
  for (const group of analysis.groups) {
    if (group.type === CardType.ROCKET) {
      score += 30
    }
    if (group.type === CardType.BOMB) {
      score += 20
    }
  }

  // Bonus for high-value individual cards
  if (rankCounts.has(17)) {
    score += 10 // Big joker
  }
  if (rankCounts.has(16)) {
    score += 8 // Small joker
  }
  const twosCount = rankCounts.get(15) ?? 0
  score += twosCount * 5 // 2s

  return score
}
