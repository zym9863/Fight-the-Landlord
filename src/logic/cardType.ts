// src/logic/cardType.ts
import { CardType } from '../types/card'
import type { Card, CardPlay } from '../types/card'

// ─── Helper: count occurrences of each rank ──────────────────────────
export function countByRank(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const c of cards) {
    counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  }
  return counts
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

// ─── Identify the CardType of a given set of cards ───────────────────
export function identifyCardType(cards: Card[]): CardPlay | null {
  if (cards.length === 0) return null
  const counts = countByRank(cards)
  const n = cards.length

  // Frequency distribution: how many ranks have count 1, 2, 3, 4
  const freqs = new Map<number, number[]>() // count → list of ranks
  for (const [rank, cnt] of counts) {
    const arr = freqs.get(cnt)
    if (arr) arr.push(rank)
    else freqs.set(cnt, [rank])
  }

  // Sort rank lists within each frequency bucket
  for (const arr of freqs.values()) arr.sort((a, b) => a - b)

  const numDistinctRanks = counts.size

  // --- 1 card: SINGLE ---
  if (n === 1) {
    return { type: CardType.SINGLE, cards, mainRank: cards[0].rank }
  }

  // --- 2 cards ---
  if (n === 2) {
    // ROCKET: both jokers
    const ranks = [...counts.keys()].sort((a, b) => a - b)
    if (ranks.length === 2 && ranks[0] === 16 && ranks[1] === 17) {
      return { type: CardType.ROCKET, cards, mainRank: 17 }
    }
    // PAIR: same rank
    if (numDistinctRanks === 1) {
      return { type: CardType.PAIR, cards, mainRank: cards[0].rank }
    }
    return null
  }

  // --- 3 cards: TRIPLE ---
  if (n === 3) {
    if (numDistinctRanks === 1) {
      return { type: CardType.TRIPLE, cards, mainRank: cards[0].rank }
    }
    return null
  }

  // --- 4 cards ---
  if (n === 4) {
    // BOMB: all same rank
    if (numDistinctRanks === 1) {
      return { type: CardType.BOMB, cards, mainRank: cards[0].rank }
    }
    // TRIPLE_WITH_SINGLE: one rank count=3, another count=1
    if (freqs.get(3)?.length === 1 && freqs.get(1)?.length === 1) {
      const tripleRank = freqs.get(3)![0]
      return { type: CardType.TRIPLE_WITH_SINGLE, cards, mainRank: tripleRank }
    }
    return null
  }

  // --- 5 cards ---
  if (n === 5) {
    // TRIPLE_WITH_PAIR: one rank count=3, another count=2
    if (freqs.get(3)?.length === 1 && freqs.get(2)?.length === 1) {
      const tripleRank = freqs.get(3)![0]
      return { type: CardType.TRIPLE_WITH_PAIR, cards, mainRank: tripleRank }
    }
    // SEQUENCE: 5 consecutive singles
    const seqResult = trySequence(counts, n)
    if (seqResult) return { type: CardType.SEQUENCE, cards, mainRank: seqResult.low, length: n }
    return null
  }

  // --- 6+ cards: multiple possibilities ---

  // Try BOMB (only 4 cards, already handled above)

  // Try SEQUENCE: all counts=1, 5+ cards, consecutive, ranks 3-14
  if (n >= 5) {
    const seqResult = trySequence(counts, n)
    if (seqResult) return { type: CardType.SEQUENCE, cards, mainRank: seqResult.low, length: n }
  }

  // Try SEQUENCE_PAIR: all counts=2, 3+ pairs, consecutive, ranks 3-14
  if (n >= 6 && n % 2 === 0) {
    const pairResult = trySequencePair(counts, n)
    if (pairResult) {
      return { type: CardType.SEQUENCE_PAIR, cards, mainRank: pairResult.low, length: n / 2 }
    }
  }

  // Try SEQUENCE_TRIPLE: all counts=3, 2+ triples, consecutive, ranks 3-14
  if (n >= 6 && n % 3 === 0) {
    const tripleResult = trySequenceTriple(counts, n)
    if (tripleResult) {
      return { type: CardType.SEQUENCE_TRIPLE, cards, mainRank: tripleResult.low, length: n / 3 }
    }
  }

  // Try FOUR_WITH_TWO_SINGLES: 6 cards, one rank has 4, remaining 2 are singles
  if (n === 6 && freqs.get(4)?.length === 1) {
    const fourRank = freqs.get(4)![0]
    // Remaining 2 cards can be any configuration (2 singles or 1 pair)
    return { type: CardType.FOUR_WITH_TWO_SINGLES, cards, mainRank: fourRank }
  }

  // Try FOUR_WITH_TWO_PAIRS: 8 cards, one rank has 4, remaining 4 form 2 distinct pairs
  if (n === 8 && freqs.get(4)?.length === 1) {
    const fourRank = freqs.get(4)![0]
    // Check remaining cards form exactly 2 pairs of different ranks
    const remainingCounts = new Map(counts)
    remainingCounts.delete(fourRank)
    const allPairs = [...remainingCounts.values()].every(c => c === 2)
    if (allPairs && remainingCounts.size === 2) {
      return { type: CardType.FOUR_WITH_TWO_PAIRS, cards, mainRank: fourRank }
    }
  }

  // Try PLANE_WITH_SINGLES: 4*N cards (N>=2), N consecutive triples + N singles
  if (n >= 8 && n % 4 === 0) {
    const planeLen = n / 4
    const planeResult = tryPlaneWithSingles(counts, planeLen)
    if (planeResult) {
      return { type: CardType.PLANE_WITH_SINGLES, cards, mainRank: planeResult.low, length: planeLen }
    }
  }

  // Try PLANE_WITH_PAIRS: 5*N cards (N>=2), N consecutive triples + N pairs
  if (n >= 10 && n % 5 === 0) {
    const planeLen = n / 5
    const planeResult = tryPlaneWithPairs(counts, planeLen)
    if (planeResult) {
      return { type: CardType.PLANE_WITH_PAIRS, cards, mainRank: planeResult.low, length: planeLen }
    }
  }

  return null
}

// ─── Try matching a sequence of singles ──────────────────────────────
function trySequence(counts: Map<number, number>, n: number): { low: number } | null {
  if (n < 5) return null
  if (counts.size !== n) return null // all must be distinct ranks
  const ranks = [...counts.keys()].sort((a, b) => a - b)
  // All ranks must be in 3-14 range
  if (ranks[0] < 3 || ranks[ranks.length - 1] > 14) return null
  // Must be consecutive
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) return null
  }
  return { low: ranks[0] }
}

// ─── Try matching consecutive pairs ──────────────────────────────────
function trySequencePair(counts: Map<number, number>, n: number): { low: number } | null {
  const numPairs = n / 2
  if (numPairs < 3) return null
  if (counts.size !== numPairs) return null
  // All counts must be exactly 2
  for (const cnt of counts.values()) {
    if (cnt !== 2) return null
  }
  const ranks = [...counts.keys()].sort((a, b) => a - b)
  if (ranks[0] < 3 || ranks[ranks.length - 1] > 14) return null
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) return null
  }
  return { low: ranks[0] }
}

// ─── Try matching consecutive triples ────────────────────────────────
function trySequenceTriple(counts: Map<number, number>, n: number): { low: number } | null {
  const numTriples = n / 3
  if (numTriples < 2) return null
  if (counts.size !== numTriples) return null
  for (const cnt of counts.values()) {
    if (cnt !== 3) return null
  }
  const ranks = [...counts.keys()].sort((a, b) => a - b)
  if (ranks[0] < 3 || ranks[ranks.length - 1] > 14) return null
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) return null
  }
  return { low: ranks[0] }
}

// ─── Try matching plane with singles ─────────────────────────────────
// planeLen consecutive triples + planeLen single cards
function tryPlaneWithSingles(counts: Map<number, number>, planeLen: number): { low: number } | null {
  if (planeLen < 2) return null
  // Find all ranks with count >= 3 in range 3-14
  const tripleRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 3 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  // Try to find a consecutive run of length planeLen among tripleRanks
  const runs = findConsecutiveRuns(tripleRanks, planeLen)
  for (const run of runs) {
    // Remove 3 from each run rank, verify remaining totals to planeLen
    let totalRemaining = 0
    for (const [rank, cnt] of counts) {
      if (run.includes(rank)) {
        totalRemaining += cnt - 3
      } else {
        totalRemaining += cnt
      }
    }
    if (totalRemaining === planeLen) {
      // The "singles" can be anything including pairs that happen to be split
      // No additional constraints on the wing cards for singles
      // But wing cards must not form a bomb (4 of a kind) with the same rank as part of the plane
      // Actually in standard rules there's no such constraint, they're just any N cards
      return { low: run[0] }
    }
  }
  return null
}

// ─── Try matching plane with pairs ───────────────────────────────────
// planeLen consecutive triples + planeLen pairs
function tryPlaneWithPairs(counts: Map<number, number>, planeLen: number): { low: number } | null {
  if (planeLen < 2) return null
  const tripleRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 3 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  const runs = findConsecutiveRuns(tripleRanks, planeLen)
  for (const run of runs) {
    // Remove triple cards, check remaining form planeLen pairs
    const remaining = new Map<number, number>()
    for (const [rank, cnt] of counts) {
      if (run.includes(rank)) {
        if (cnt > 3) remaining.set(rank, cnt - 3)
      } else {
        remaining.set(rank, cnt)
      }
    }
    // All remaining must be pairs, and there must be exactly planeLen of them
    if (remaining.size === planeLen) {
      let allPairs = true
      for (const cnt of remaining.values()) {
        if (cnt !== 2) { allPairs = false; break }
      }
      if (allPairs) return { low: run[0] }
    }
  }
  return null
}

// ─── Find consecutive runs of given length in sorted rank array ──────
function findConsecutiveRuns(sortedRanks: number[], length: number): number[][] {
  const results: number[][] = []
  if (sortedRanks.length < length) return results

  for (let i = 0; i <= sortedRanks.length - length; i++) {
    let valid = true
    for (let j = 1; j < length; j++) {
      if (sortedRanks[i + j] !== sortedRanks[i] + j) {
        valid = false
        break
      }
    }
    if (valid) {
      results.push(sortedRanks.slice(i, i + length))
    }
  }
  return results
}

// ═══════════════════════════════════════════════════════════════════════
// findAllPlays - find every possible play combination from a hand
// ═══════════════════════════════════════════════════════════════════════
export function findAllPlays(hand: Card[]): CardPlay[] {
  const plays: CardPlay[] = []
  const byRank = groupByRank(hand)
  const counts = countByRank(hand)

  // Singles
  for (const [rank, group] of byRank) {
    plays.push({ type: CardType.SINGLE, cards: [group[0]], mainRank: rank })
  }

  // Pairs
  for (const [rank, group] of byRank) {
    if (group.length >= 2) {
      plays.push({ type: CardType.PAIR, cards: group.slice(0, 2), mainRank: rank })
    }
  }

  // Triples
  for (const [rank, group] of byRank) {
    if (group.length >= 3) {
      plays.push({ type: CardType.TRIPLE, cards: group.slice(0, 3), mainRank: rank })
    }
  }

  // Triple with single
  for (const [tripleRank, tripleGroup] of byRank) {
    if (tripleGroup.length >= 3) {
      const tripleCards = tripleGroup.slice(0, 3)
      for (const [singleRank, singleGroup] of byRank) {
        if (singleRank !== tripleRank) {
          plays.push({
            type: CardType.TRIPLE_WITH_SINGLE,
            cards: [...tripleCards, singleGroup[0]],
            mainRank: tripleRank,
          })
        }
      }
    }
  }

  // Triple with pair
  for (const [tripleRank, tripleGroup] of byRank) {
    if (tripleGroup.length >= 3) {
      const tripleCards = tripleGroup.slice(0, 3)
      for (const [pairRank, pairGroup] of byRank) {
        if (pairRank !== tripleRank && pairGroup.length >= 2) {
          plays.push({
            type: CardType.TRIPLE_WITH_PAIR,
            cards: [...tripleCards, ...pairGroup.slice(0, 2)],
            mainRank: tripleRank,
          })
        }
      }
    }
  }

  // Bombs
  plays.push(...findAllBombs(hand))

  // Rockets
  plays.push(...findRockets(hand))

  // Sequences
  plays.push(...findSequences(hand, counts))

  // Sequence pairs
  plays.push(...findSequencePairs(hand, counts))

  // Sequence triples (飞机不带翼)
  plays.push(...findSequenceTriples(hand, counts))

  // Planes with singles
  plays.push(...findPlanesWithSingles(hand, byRank, counts))

  // Planes with pairs
  plays.push(...findPlanesWithPairs(hand, byRank, counts))

  // Four with two singles
  plays.push(...findFourWithTwoSingles(hand, byRank))

  // Four with two pairs
  plays.push(...findFourWithTwoPairs(hand, byRank))

  return plays
}

// ─── Find all bombs ──────────────────────────────────────────────────
export function findAllBombs(hand: Card[]): CardPlay[] {
  const plays: CardPlay[] = []
  const byRank = groupByRank(hand)
  for (const [rank, group] of byRank) {
    if (group.length === 4) {
      plays.push({ type: CardType.BOMB, cards: [...group], mainRank: rank })
    }
  }
  return plays
}

// ─── Find rockets ────────────────────────────────────────────────────
export function findRockets(hand: Card[]): CardPlay[] {
  const byRank = groupByRank(hand)
  const small = byRank.get(16)
  const big = byRank.get(17)
  if (small && big) {
    return [{ type: CardType.ROCKET, cards: [small[0], big[0]], mainRank: 17 }]
  }
  return []
}

// ─── Find all possible sequences (5+ consecutive singles) ────────────
export function findSequences(_hand: Card[], counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const byRank = groupByRank(_hand)
  // Valid ranks for sequences: 3-14
  const validRanks = [...counts.keys()].filter(r => r >= 3 && r <= 14).sort((a, b) => a - b)

  // Find consecutive runs, then generate all sub-sequences of length >= 5
  let i = 0
  while (i < validRanks.length) {
    let end = i
    while (end + 1 < validRanks.length && validRanks[end + 1] === validRanks[end] + 1) {
      end++
    }
    const runLength = end - i + 1
    if (runLength >= 5) {
      for (let len = 5; len <= runLength; len++) {
        for (let start = i; start + len - 1 <= end; start++) {
          const seqCards: Card[] = []
          for (let k = start; k < start + len; k++) {
            seqCards.push(byRank.get(validRanks[k])![0])
          }
          plays.push({
            type: CardType.SEQUENCE,
            cards: seqCards,
            mainRank: validRanks[start],
            length: len,
          })
        }
      }
    }
    i = end + 1
  }

  return plays
}

// ─── Find all consecutive pair sequences (3+ consecutive pairs) ──────
export function findSequencePairs(_hand: Card[], counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const byRank = groupByRank(_hand)
  // Ranks with at least 2 cards, in range 3-14
  const pairRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 2 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  let i = 0
  while (i < pairRanks.length) {
    let end = i
    while (end + 1 < pairRanks.length && pairRanks[end + 1] === pairRanks[end] + 1) {
      end++
    }
    const runLength = end - i + 1
    if (runLength >= 3) {
      for (let len = 3; len <= runLength; len++) {
        for (let start = i; start + len - 1 <= end; start++) {
          const seqCards: Card[] = []
          for (let k = start; k < start + len; k++) {
            const group = byRank.get(pairRanks[k])!
            seqCards.push(group[0], group[1])
          }
          plays.push({
            type: CardType.SEQUENCE_PAIR,
            cards: seqCards,
            mainRank: pairRanks[start],
            length: len,
          })
        }
      }
    }
    i = end + 1
  }

  return plays
}

// ─── Find all consecutive triple sequences (2+ consecutive triples) ──
function findSequenceTriples(_hand: Card[], counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const byRank = groupByRank(_hand)
  const tripleRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 3 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  let i = 0
  while (i < tripleRanks.length) {
    let end = i
    while (end + 1 < tripleRanks.length && tripleRanks[end + 1] === tripleRanks[end] + 1) {
      end++
    }
    const runLength = end - i + 1
    if (runLength >= 2) {
      for (let len = 2; len <= runLength; len++) {
        for (let start = i; start + len - 1 <= end; start++) {
          const seqCards: Card[] = []
          for (let k = start; k < start + len; k++) {
            const group = byRank.get(tripleRanks[k])!
            seqCards.push(group[0], group[1], group[2])
          }
          plays.push({
            type: CardType.SEQUENCE_TRIPLE,
            cards: seqCards,
            mainRank: tripleRanks[start],
            length: len,
          })
        }
      }
    }
    i = end + 1
  }

  return plays
}

// ─── Find all planes with singles ────────────────────────────────────
function findPlanesWithSingles(_hand: Card[], byRank: Map<number, Card[]>, counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const tripleRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 3 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  // For each consecutive triple run of length >= 2
  for (let i = 0; i < tripleRanks.length; i++) {
    let end = i
    while (end + 1 < tripleRanks.length && tripleRanks[end + 1] === tripleRanks[end] + 1) {
      end++
    }
    const runLength = end - i + 1
    if (runLength >= 2) {
      for (let len = 2; len <= runLength; len++) {
        for (let start = i; start + len - 1 <= end; start++) {
          const planeRanks = tripleRanks.slice(start, start + len)
          const tripleCards: Card[] = []
          for (const r of planeRanks) {
            const group = byRank.get(r)!
            tripleCards.push(group[0], group[1], group[2])
          }

          // Need `len` single cards from remaining hand
          const usedRanksSet = new Set(planeRanks)
          const availableSingles: Card[] = []
          for (const [rank, group] of byRank) {
            if (usedRanksSet.has(rank)) {
              // Can use extra cards beyond 3 from this rank
              if (group.length > 3) {
                availableSingles.push(group[3])
              }
            } else {
              availableSingles.push(group[0])
            }
          }

          // Generate all combinations of `len` singles from availableSingles
          if (availableSingles.length >= len) {
            const combos = combinations(availableSingles, len)
            for (const combo of combos) {
              plays.push({
                type: CardType.PLANE_WITH_SINGLES,
                cards: [...tripleCards, ...combo],
                mainRank: planeRanks[0],
                length: len,
              })
            }
          }
        }
      }
    }
  }

  return plays
}

// ─── Find all planes with pairs ──────────────────────────────────────
function findPlanesWithPairs(_hand: Card[], byRank: Map<number, Card[]>, counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const tripleRanks = [...counts.entries()]
    .filter(([rank, cnt]) => cnt >= 3 && rank >= 3 && rank <= 14)
    .map(([rank]) => rank)
    .sort((a, b) => a - b)

  for (let i = 0; i < tripleRanks.length; i++) {
    let end = i
    while (end + 1 < tripleRanks.length && tripleRanks[end + 1] === tripleRanks[end] + 1) {
      end++
    }
    const runLength = end - i + 1
    if (runLength >= 2) {
      for (let len = 2; len <= runLength; len++) {
        for (let start = i; start + len - 1 <= end; start++) {
          const planeRanks = tripleRanks.slice(start, start + len)
          const tripleCards: Card[] = []
          for (const r of planeRanks) {
            const group = byRank.get(r)!
            tripleCards.push(group[0], group[1], group[2])
          }

          // Need `len` distinct pairs from remaining hand
          const usedRanksSet = new Set(planeRanks)
          const availablePairRanks: number[] = []
          for (const [rank, group] of byRank) {
            if (usedRanksSet.has(rank)) {
              // Can use extra pair if count >= 5 (3 used + 2 remaining)
              if (group.length >= 5) {
                availablePairRanks.push(rank)
              }
            } else {
              if (group.length >= 2) {
                availablePairRanks.push(rank)
              }
            }
          }

          // Generate all combinations of `len` pair-ranks from available
          if (availablePairRanks.length >= len) {
            const pairCombos = combinations(availablePairRanks, len)
            for (const combo of pairCombos) {
              const pairCards: Card[] = []
              for (const r of combo) {
                const group = byRank.get(r)!
                if (usedRanksSet.has(r)) {
                  // Use cards at index 3 and 4
                  pairCards.push(group[3], group[4])
                } else {
                  pairCards.push(group[0], group[1])
                }
              }
              plays.push({
                type: CardType.PLANE_WITH_PAIRS,
                cards: [...tripleCards, ...pairCards],
                mainRank: planeRanks[0],
                length: len,
              })
            }
          }
        }
      }
    }
  }

  return plays
}

// ─── Find all four-with-two-singles ──────────────────────────────────
function findFourWithTwoSingles(_hand: Card[], byRank: Map<number, Card[]>): CardPlay[] {
  const plays: CardPlay[] = []
  const fourRanks: number[] = []
  for (const [rank, group] of byRank) {
    if (group.length === 4) fourRanks.push(rank)
  }

  for (const fourRank of fourRanks) {
    const fourCards = byRank.get(fourRank)!

    // Collect all available single cards (one from each other rank)
    const availableSingles: Card[] = []
    for (const [rank, group] of byRank) {
      if (rank !== fourRank) {
        availableSingles.push(group[0])
      }
    }

    // Choose 2 singles from available
    if (availableSingles.length >= 2) {
      const combos = combinations(availableSingles, 2)
      for (const combo of combos) {
        plays.push({
          type: CardType.FOUR_WITH_TWO_SINGLES,
          cards: [...fourCards, ...combo],
          mainRank: fourRank,
        })
      }
    }
  }

  return plays
}

// ─── Find all four-with-two-pairs ────────────────────────────────────
function findFourWithTwoPairs(_hand: Card[], byRank: Map<number, Card[]>): CardPlay[] {
  const plays: CardPlay[] = []
  const fourRanks: number[] = []
  for (const [rank, group] of byRank) {
    if (group.length === 4) fourRanks.push(rank)
  }

  for (const fourRank of fourRanks) {
    const fourCards = byRank.get(fourRank)!

    // Collect all ranks with at least 2 cards (excluding the four rank)
    const pairRanks: number[] = []
    for (const [rank, group] of byRank) {
      if (rank !== fourRank && group.length >= 2) {
        pairRanks.push(rank)
      }
    }

    // Choose 2 distinct pair ranks
    if (pairRanks.length >= 2) {
      const combos = combinations(pairRanks, 2)
      for (const combo of combos) {
        const pairCards: Card[] = []
        for (const r of combo) {
          const group = byRank.get(r)!
          pairCards.push(group[0], group[1])
        }
        plays.push({
          type: CardType.FOUR_WITH_TWO_PAIRS,
          cards: [...fourCards, ...pairCards],
          mainRank: fourRank,
        })
      }
    }
  }

  return plays
}

// ─── Combination utility ─────────────────────────────────────────────
function combinations<T>(arr: T[], k: number): T[][] {
  const results: T[][] = []
  if (k === 0) return [[]]
  if (arr.length < k) return results

  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      results.push([...current])
      return
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }
  backtrack(0, [])
  return results
}

// ═══════════════════════════════════════════════════════════════════════
// findValidPlays - find plays that can beat the last play
// ═══════════════════════════════════════════════════════════════════════
export function findValidPlays(hand: Card[], lastPlay: CardPlay | null): CardPlay[] {
  // Active play: return all possible plays
  if (!lastPlay) {
    return findAllPlays(hand)
  }

  const allPlays = findAllPlays(hand)
  const result: CardPlay[] = []

  for (const play of allPlays) {
    if (canBeat(play, lastPlay)) {
      result.push(play)
    }
  }

  return result
}

// ─── Can a play beat another play? ───────────────────────────────────
function canBeat(play: CardPlay, lastPlay: CardPlay): boolean {
  // ROCKET beats everything
  if (play.type === CardType.ROCKET) return true

  // BOMB beats any non-BOMB non-ROCKET
  if (play.type === CardType.BOMB) {
    if (lastPlay.type === CardType.ROCKET) return false
    if (lastPlay.type === CardType.BOMB) {
      return play.mainRank > lastPlay.mainRank
    }
    return true // BOMB beats everything else
  }

  // Same type comparison
  if (play.type !== lastPlay.type) return false

  // For types with length, must match length
  if (play.length !== undefined && lastPlay.length !== undefined) {
    if (play.length !== lastPlay.length) return false
  }

  // Higher mainRank wins
  return play.mainRank > lastPlay.mainRank
}
