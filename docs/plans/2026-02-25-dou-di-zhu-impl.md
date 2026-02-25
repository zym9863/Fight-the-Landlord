# 斗地主游戏实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现一个完整的单机斗地主游戏，玩家对战两个高级AI，使用 Vue 3 + Pinia + TypeScript。

**Architecture:** 逻辑层（logic/）纯 TypeScript 实现，不依赖 Vue，包含发牌、牌型识别、比较、AI策略四个模块。Pinia store 管理游戏状态并调用逻辑层。UI组件层只负责渲染和交互。

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite 8, pnpm

---

## Task 1: 项目基础设施搭建

**Files:**
- Modify: `package.json`
- Modify: `src/main.ts`
- Create: `src/types/card.ts`
- Modify: `index.html`
- Delete content of: `src/components/HelloWorld.vue` (later replaced)

**Step 1: 安装 Pinia**

Run: `cd "D:/github/Fight the Landlord" && pnpm add pinia`

**Step 2: 配置 Pinia 到 main.ts**

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

**Step 3: 创建目录结构**

Run:
```bash
mkdir -p src/types src/logic src/stores src/composables
```

**Step 4: 创建类型定义文件 `src/types/card.ts`**

```typescript
export type Suit = 'spade' | 'heart' | 'club' | 'diamond'

export interface Card {
  id: number          // 唯一ID，0-53
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
  SEQUENCE = 'SEQUENCE',           // 顺子，5+张
  SEQUENCE_PAIR = 'SEQUENCE_PAIR', // 连对，3+对
  SEQUENCE_TRIPLE = 'SEQUENCE_TRIPLE', // 飞机不带
  PLANE_WITH_SINGLES = 'PLANE_WITH_SINGLES', // 飞机带单
  PLANE_WITH_PAIRS = 'PLANE_WITH_PAIRS',     // 飞机带对
  FOUR_WITH_TWO_SINGLES = 'FOUR_WITH_TWO_SINGLES',
  FOUR_WITH_TWO_PAIRS = 'FOUR_WITH_TWO_PAIRS',
  BOMB = 'BOMB',
  ROCKET = 'ROCKET',
}

export interface CardPlay {
  type: CardType
  cards: Card[]
  mainRank: number   // 主牌rank，用于比较大小
  length?: number    // 顺子/连对/飞机的长度
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
  play: CardPlay | null  // null = pass
}
```

**Step 5: 更新 index.html title**

将 `<title>fight-the-landlord</title>` 改为 `<title>斗地主</title>`，`lang="en"` 改为 `lang="zh-CN"`。

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: project setup with Pinia and type definitions"
```

---

## Task 2: 发牌模块

**Files:**
- Create: `src/logic/deck.ts`

**Step 1: 实现 deck.ts**

```typescript
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
```

**Step 2: 验证**

Run: `pnpm dev`，在浏览器console中测试（临时）。

**Step 3: Commit**

```bash
git add src/logic/deck.ts
git commit -m "feat: implement deck creation, shuffle, and dealing"
```

---

## Task 3: 牌型识别模块

**Files:**
- Create: `src/logic/cardType.ts`

这是最复杂的逻辑模块。需要从一组牌中识别出具体的牌型。

**Step 1: 实现辅助函数和牌型识别**

```typescript
// src/logic/cardType.ts
import { CardType } from '../types/card'
import type { Card, CardPlay } from '../types/card'

/** 统计每个rank的数量 */
export function countByRank(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const c of cards) {
    counts.set(c.rank, (counts.get(c.rank) || 0) + 1)
  }
  return counts
}

/** 获取连续rank序列（不含2和王），返回排序后的ranks */
function getConsecutiveRanks(ranks: number[]): number[][] {
  const filtered = ranks.filter(r => r >= 3 && r <= 14).sort((a, b) => a - b)
  if (filtered.length === 0) return []
  const sequences: number[][] = [[filtered[0]]]
  for (let i = 1; i < filtered.length; i++) {
    if (filtered[i] === filtered[i - 1] + 1) {
      sequences[sequences.length - 1].push(filtered[i])
    } else {
      sequences.push([filtered[i]])
    }
  }
  return sequences
}

/**
 * 识别一组牌的牌型，返回 CardPlay 或 null（无效牌型）
 */
export function identifyCardType(cards: Card[]): CardPlay | null {
  const n = cards.length
  if (n === 0) return null

  const counts = countByRank(cards)
  const ranks = [...counts.keys()].sort((a, b) => a - b)

  // 火箭：双王
  if (n === 2 && counts.has(16) && counts.has(17)) {
    return { type: CardType.ROCKET, cards, mainRank: 17 }
  }

  // 炸弹：四张相同
  if (n === 4 && counts.size === 1 && [...counts.values()][0] === 4) {
    return { type: CardType.BOMB, cards, mainRank: ranks[0] }
  }

  // 单张
  if (n === 1) {
    return { type: CardType.SINGLE, cards, mainRank: ranks[0] }
  }

  // 对子
  if (n === 2 && counts.size === 1 && [...counts.values()][0] === 2) {
    return { type: CardType.PAIR, cards, mainRank: ranks[0] }
  }

  // 三张
  if (n === 3 && counts.size === 1 && [...counts.values()][0] === 3) {
    return { type: CardType.TRIPLE, cards, mainRank: ranks[0] }
  }

  // 三带一
  if (n === 4 && counts.size === 2) {
    const entries = [...counts.entries()]
    const tripleEntry = entries.find(([, c]) => c === 3)
    const singleEntry = entries.find(([, c]) => c === 1)
    if (tripleEntry && singleEntry) {
      return { type: CardType.TRIPLE_WITH_SINGLE, cards, mainRank: tripleEntry[0] }
    }
  }

  // 三带二
  if (n === 5 && counts.size === 2) {
    const entries = [...counts.entries()]
    const tripleEntry = entries.find(([, c]) => c === 3)
    const pairEntry = entries.find(([, c]) => c === 2)
    if (tripleEntry && pairEntry) {
      return { type: CardType.TRIPLE_WITH_PAIR, cards, mainRank: tripleEntry[0] }
    }
  }

  // 四带二（单）
  if (n === 6) {
    const entries = [...counts.entries()]
    const fourEntry = entries.find(([, c]) => c === 4)
    if (fourEntry) {
      const rest = entries.filter(([, c]) => c !== 4)
      const restTotal = rest.reduce((sum, [, c]) => sum + c, 0)
      if (restTotal === 2) {
        return { type: CardType.FOUR_WITH_TWO_SINGLES, cards, mainRank: fourEntry[0] }
      }
    }
  }

  // 四带二（对）
  if (n === 8) {
    const entries = [...counts.entries()]
    const fourEntry = entries.find(([, c]) => c === 4)
    if (fourEntry && entries.filter(([, c]) => c === 2).length === 2) {
      return { type: CardType.FOUR_WITH_TWO_PAIRS, cards, mainRank: fourEntry[0] }
    }
  }

  // 顺子：5+张连续（3-A，不含2和王）
  if (n >= 5 && counts.size === n) {
    // 每个rank只出现1次
    const allSingle = [...counts.values()].every(c => c === 1)
    if (allSingle) {
      const sorted = ranks.filter(r => r >= 3 && r <= 14)
      if (sorted.length === n) {
        const isConsecutive = sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1)
        if (isConsecutive) {
          return { type: CardType.SEQUENCE, cards, mainRank: sorted[0], length: n }
        }
      }
    }
  }

  // 连对：3+对连续
  if (n >= 6 && n % 2 === 0) {
    const pairCount = n / 2
    const allPairs = [...counts.values()].every(c => c === 2)
    if (allPairs && counts.size === pairCount) {
      const sorted = ranks.filter(r => r >= 3 && r <= 14)
      if (sorted.length === pairCount) {
        const isConsecutive = sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1)
        if (isConsecutive) {
          return { type: CardType.SEQUENCE_PAIR, cards, mainRank: sorted[0], length: pairCount }
        }
      }
    }
  }

  // 飞机不带：2+组连续三张
  if (n >= 6 && n % 3 === 0) {
    const tripleCount = n / 3
    const allTriples = [...counts.values()].every(c => c === 3)
    if (allTriples && counts.size === tripleCount) {
      const sorted = ranks.filter(r => r >= 3 && r <= 14)
      if (sorted.length === tripleCount) {
        const isConsecutive = sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1)
        if (isConsecutive) {
          return { type: CardType.SEQUENCE_TRIPLE, cards, mainRank: sorted[0], length: tripleCount }
        }
      }
    }
  }

  // 飞机带单：连续三张 + 等量单牌
  // 飞机带对：连续三张 + 等量对子
  {
    const tripleRanks = [...counts.entries()]
      .filter(([, c]) => c >= 3)
      .map(([r]) => r)
      .filter(r => r >= 3 && r <= 14)
      .sort((a, b) => a - b)

    // 找出所有连续三张组合
    const sequences = getConsecutiveRanks(tripleRanks)
    for (const seq of sequences) {
      if (seq.length < 2) continue
      // 尝试每种可能的连续长度
      for (let len = seq.length; len >= 2; len--) {
        for (let start = 0; start <= seq.length - len; start++) {
          const tripleSeq = seq.slice(start, start + len)
          const tripleCardCount = len * 3
          const remaining = n - tripleCardCount

          // 飞机带单
          if (remaining === len) {
            return {
              type: CardType.PLANE_WITH_SINGLES, cards,
              mainRank: tripleSeq[0], length: len
            }
          }
          // 飞机带对
          if (remaining === len * 2) {
            // 检查剩余牌是否都是对子
            const remainingCounts = new Map(counts)
            for (const r of tripleSeq) {
              const cur = remainingCounts.get(r)!
              if (cur === 3) remainingCounts.delete(r)
              else remainingCounts.set(r, cur - 3)
            }
            const allPairs = [...remainingCounts.values()].every(c => c === 2)
            if (allPairs && remainingCounts.size === len) {
              return {
                type: CardType.PLANE_WITH_PAIRS, cards,
                mainRank: tripleSeq[0], length: len
              }
            }
          }
        }
      }
    }
  }

  return null // 无效牌型
}

/**
 * 找出手牌中所有可以打过 lastPlay 的组合
 */
export function findValidPlays(hand: Card[], lastPlay: CardPlay | null): CardPlay[] {
  if (!lastPlay) {
    return findAllPlays(hand)
  }
  const allPlays = findAllPlaysOfType(hand, lastPlay.type, lastPlay.length)
  const validPlays = allPlays.filter(p => {
    if (p.type === lastPlay.type) {
      if (p.length !== undefined && lastPlay.length !== undefined && p.length !== lastPlay.length) return false
      return p.mainRank > lastPlay.mainRank
    }
    return false
  })

  // 炸弹能打任何非炸弹非火箭
  if (lastPlay.type !== CardType.BOMB && lastPlay.type !== CardType.ROCKET) {
    validPlays.push(...findAllBombs(hand))
  } else if (lastPlay.type === CardType.BOMB) {
    // 更大的炸弹
    validPlays.push(...findAllBombs(hand).filter(b => b.mainRank > lastPlay.mainRank))
  }
  // 火箭能打一切
  validPlays.push(...findRockets(hand))

  return validPlays
}

/** 找出手牌中所有可能的出牌组合（主动出牌时） */
export function findAllPlays(hand: Card[]): CardPlay[] {
  const plays: CardPlay[] = []
  const counts = countByRank(hand)
  const cardsByRank = groupByRank(hand)

  // 单张
  for (const [rank, cards] of cardsByRank) {
    plays.push({ type: CardType.SINGLE, cards: [cards[0]], mainRank: rank })
  }

  // 对子
  for (const [rank, cards] of cardsByRank) {
    if (cards.length >= 2) {
      plays.push({ type: CardType.PAIR, cards: cards.slice(0, 2), mainRank: rank })
    }
  }

  // 三张、三带一、三带二
  for (const [rank, cards] of cardsByRank) {
    if (cards.length >= 3) {
      const triple = cards.slice(0, 3)
      plays.push({ type: CardType.TRIPLE, cards: triple, mainRank: rank })
      // 三带一
      for (const [r2, c2] of cardsByRank) {
        if (r2 !== rank) {
          plays.push({
            type: CardType.TRIPLE_WITH_SINGLE,
            cards: [...triple, c2[0]],
            mainRank: rank
          })
        }
      }
      // 三带二
      for (const [r2, c2] of cardsByRank) {
        if (r2 !== rank && c2.length >= 2) {
          plays.push({
            type: CardType.TRIPLE_WITH_PAIR,
            cards: [...triple, c2[0], c2[1]],
            mainRank: rank
          })
        }
      }
    }
  }

  // 炸弹
  plays.push(...findAllBombs(hand))

  // 火箭
  plays.push(...findRockets(hand))

  // 顺子
  plays.push(...findSequences(hand, counts))

  // 连对
  plays.push(...findSequencePairs(hand, counts))

  // 飞机
  plays.push(...findPlanes(hand, cardsByRank))

  return plays
}

/** 找出指定类型的所有出法 */
function findAllPlaysOfType(hand: Card[], type: CardType, length?: number): CardPlay[] {
  return findAllPlays(hand).filter(p => {
    if (p.type !== type) return false
    if (length !== undefined && p.length !== undefined && p.length !== length) return false
    return true
  })
}

function groupByRank(cards: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>()
  for (const c of cards) {
    if (!groups.has(c.rank)) groups.set(c.rank, [])
    groups.get(c.rank)!.push(c)
  }
  return groups
}

function findAllBombs(hand: Card[]): CardPlay[] {
  const bombs: CardPlay[] = []
  const groups = groupByRank(hand)
  for (const [rank, cards] of groups) {
    if (cards.length === 4) {
      bombs.push({ type: CardType.BOMB, cards, mainRank: rank })
    }
  }
  return bombs
}

function findRockets(hand: Card[]): CardPlay[] {
  const smallJoker = hand.find(c => c.rank === 16)
  const bigJoker = hand.find(c => c.rank === 17)
  if (smallJoker && bigJoker) {
    return [{ type: CardType.ROCKET, cards: [smallJoker, bigJoker], mainRank: 17 }]
  }
  return []
}

function findSequences(hand: Card[], counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const availableRanks = [...counts.keys()].filter(r => r >= 3 && r <= 14).sort((a, b) => a - b)
  const cardsByRank = groupByRank(hand)

  for (let start = 0; start < availableRanks.length; start++) {
    const seq: number[] = [availableRanks[start]]
    for (let end = start + 1; end < availableRanks.length; end++) {
      if (availableRanks[end] === seq[seq.length - 1] + 1) {
        seq.push(availableRanks[end])
        if (seq.length >= 5) {
          const cards = seq.map(r => cardsByRank.get(r)![0])
          plays.push({
            type: CardType.SEQUENCE, cards,
            mainRank: seq[0], length: seq.length
          })
        }
      } else {
        break
      }
    }
  }
  return plays
}

function findSequencePairs(hand: Card[], counts: Map<number, number>): CardPlay[] {
  const plays: CardPlay[] = []
  const pairRanks = [...counts.entries()]
    .filter(([r, c]) => c >= 2 && r >= 3 && r <= 14)
    .map(([r]) => r)
    .sort((a, b) => a - b)
  const cardsByRank = groupByRank(hand)

  for (let start = 0; start < pairRanks.length; start++) {
    const seq: number[] = [pairRanks[start]]
    for (let end = start + 1; end < pairRanks.length; end++) {
      if (pairRanks[end] === seq[seq.length - 1] + 1) {
        seq.push(pairRanks[end])
        if (seq.length >= 3) {
          const cards = seq.flatMap(r => cardsByRank.get(r)!.slice(0, 2))
          plays.push({
            type: CardType.SEQUENCE_PAIR, cards,
            mainRank: seq[0], length: seq.length
          })
        }
      } else {
        break
      }
    }
  }
  return plays
}

function findPlanes(hand: Card[], cardsByRank: Map<number, Card[]>): CardPlay[] {
  const plays: CardPlay[] = []
  const tripleRanks = [...cardsByRank.entries()]
    .filter(([r, c]) => c.length >= 3 && r >= 3 && r <= 14)
    .map(([r]) => r)
    .sort((a, b) => a - b)

  for (let start = 0; start < tripleRanks.length; start++) {
    const seq: number[] = [tripleRanks[start]]
    for (let end = start + 1; end < tripleRanks.length; end++) {
      if (tripleRanks[end] === seq[seq.length - 1] + 1) {
        seq.push(tripleRanks[end])
        if (seq.length >= 2) {
          // 飞机不带
          const tripleCards = seq.flatMap(r => cardsByRank.get(r)!.slice(0, 3))
          plays.push({
            type: CardType.SEQUENCE_TRIPLE, cards: tripleCards,
            mainRank: seq[0], length: seq.length
          })

          // 飞机带单
          const otherRanks = [...cardsByRank.keys()].filter(r => !seq.includes(r))
          if (otherRanks.length >= seq.length) {
            const singles = otherRanks.slice(0, seq.length).map(r => cardsByRank.get(r)![0])
            plays.push({
              type: CardType.PLANE_WITH_SINGLES,
              cards: [...tripleCards, ...singles],
              mainRank: seq[0], length: seq.length
            })
          }

          // 飞机带对
          const pairRanks = [...cardsByRank.entries()]
            .filter(([r, c]) => !seq.includes(r) && c.length >= 2)
            .map(([r]) => r)
          if (pairRanks.length >= seq.length) {
            const pairs = pairRanks.slice(0, seq.length)
              .flatMap(r => cardsByRank.get(r)!.slice(0, 2))
            plays.push({
              type: CardType.PLANE_WITH_PAIRS,
              cards: [...tripleCards, ...pairs],
              mainRank: seq[0], length: seq.length
            })
          }
        }
      } else {
        break
      }
    }
  }
  return plays
}
```

**Step 2: Commit**

```bash
git add src/logic/cardType.ts
git commit -m "feat: implement card type identification and valid play finder"
```

---

## Task 4: 牌型比较模块

**Files:**
- Create: `src/logic/compare.ts`

**Step 1: 实现 compare.ts**

```typescript
// src/logic/compare.ts
import { CardType } from '../types/card'
import type { CardPlay } from '../types/card'

/**
 * 判断 play 是否能打过 lastPlay
 * 返回 true 表示可以出
 */
export function canBeat(play: CardPlay, lastPlay: CardPlay): boolean {
  // 火箭打一切
  if (play.type === CardType.ROCKET) return true
  if (lastPlay.type === CardType.ROCKET) return false

  // 炸弹打非炸弹
  if (play.type === CardType.BOMB && lastPlay.type !== CardType.BOMB) return true
  if (play.type !== CardType.BOMB && lastPlay.type === CardType.BOMB) return false

  // 同类型比较
  if (play.type !== lastPlay.type) return false

  // 顺子/连对/飞机需要长度相同
  if (play.length !== undefined && lastPlay.length !== undefined) {
    if (play.length !== lastPlay.length) return false
  }
  if (play.cards.length !== lastPlay.cards.length) return false

  return play.mainRank > lastPlay.mainRank
}
```

**Step 2: Commit**

```bash
git add src/logic/compare.ts
git commit -m "feat: implement card play comparison logic"
```

---

## Task 5: AI 策略引擎 - 手牌分析器

**Files:**
- Create: `src/logic/ai/handAnalyzer.ts`

这是AI的核心。将手牌拆分为最优的出牌组合。

**Step 1: 实现 handAnalyzer.ts**

```typescript
// src/logic/ai/handAnalyzer.ts
import type { Card, CardPlay } from '../../types/card'
import { CardType } from '../../types/card'
import { countByRank } from '../cardType'

interface HandAnalysis {
  groups: CardPlay[]     // 拆分后的牌组
  totalMoves: number     // 总出牌次数
}

/** 将手牌按rank分组 */
function groupByRank(cards: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>()
  for (const c of cards) {
    if (!groups.has(c.rank)) groups.set(c.rank, [])
    groups.get(c.rank)!.push(c)
  }
  return groups
}

/**
 * 分析手牌，返回最优拆牌方案（最少出牌次数）
 * 使用贪心策略 + 局部搜索
 */
export function analyzeHand(cards: Card[]): HandAnalysis {
  if (cards.length === 0) return { groups: [], totalMoves: 0 }

  const groups = groupByRank(cards)
  const plays: CardPlay[] = []
  const remaining = new Map<number, Card[]>()
  for (const [rank, cs] of groups) {
    remaining.set(rank, [...cs])
  }

  // 1. 先识别火箭
  if (remaining.has(16) && remaining.has(17)) {
    const rocket: Card[] = [remaining.get(16)![0], remaining.get(17)![0]]
    plays.push({ type: CardType.ROCKET, cards: rocket, mainRank: 17 })
    remaining.delete(16)
    remaining.delete(17)
  }

  // 2. 识别炸弹（暂时保留，后面决定是否拆）
  const bombs: number[] = []
  for (const [rank, cs] of remaining) {
    if (cs.length === 4) bombs.push(rank)
  }

  // 3. 找飞机（连续三张）
  const tripleRanks = [...remaining.entries()]
    .filter(([r, c]) => c.length >= 3 && r >= 3 && r <= 14)
    .map(([r]) => r)
    .sort((a, b) => a - b)

  // 找最长连续三张序列
  const planeSequences: number[][] = []
  let currentSeq: number[] = []
  for (const r of tripleRanks) {
    if (currentSeq.length === 0 || r === currentSeq[currentSeq.length - 1] + 1) {
      currentSeq.push(r)
    } else {
      if (currentSeq.length >= 2) planeSequences.push([...currentSeq])
      currentSeq = [r]
    }
  }
  if (currentSeq.length >= 2) planeSequences.push(currentSeq)

  // 使用飞机
  for (const seq of planeSequences) {
    const tripleCards: Card[] = []
    for (const r of seq) {
      tripleCards.push(...remaining.get(r)!.slice(0, 3))
      const leftover = remaining.get(r)!.slice(3)
      if (leftover.length > 0) remaining.set(r, leftover)
      else remaining.delete(r)
    }

    // 尝试带单或带对
    const otherCards = [...remaining.values()].flat()
    if (otherCards.length >= seq.length * 2) {
      // 找足够的对子带
      const pairRanks = [...remaining.entries()].filter(([, c]) => c.length >= 2)
      if (pairRanks.length >= seq.length) {
        const pairs: Card[] = []
        let taken = 0
        for (const [r, c] of pairRanks) {
          if (taken >= seq.length) break
          pairs.push(c[0], c[1])
          const leftover = c.slice(2)
          if (leftover.length > 0) remaining.set(r, leftover)
          else remaining.delete(r)
          taken++
        }
        plays.push({
          type: CardType.PLANE_WITH_PAIRS,
          cards: [...tripleCards, ...pairs],
          mainRank: seq[0], length: seq.length
        })
        continue
      }
    }
    if (otherCards.length >= seq.length) {
      // 带单
      const singles: Card[] = []
      let taken = 0
      for (const [r, c] of [...remaining.entries()]) {
        if (taken >= seq.length) break
        singles.push(c[0])
        const leftover = c.slice(1)
        if (leftover.length > 0) remaining.set(r, leftover)
        else remaining.delete(r)
        taken++
      }
      plays.push({
        type: CardType.PLANE_WITH_SINGLES,
        cards: [...tripleCards, ...singles],
        mainRank: seq[0], length: seq.length
      })
    } else {
      // 飞机不带
      plays.push({
        type: CardType.SEQUENCE_TRIPLE,
        cards: tripleCards,
        mainRank: seq[0], length: seq.length
      })
    }
  }

  // 4. 找顺子（5+连续单牌，3-A）
  const singleRanks = [...remaining.entries()]
    .filter(([r]) => r >= 3 && r <= 14)
    .map(([r]) => r)
    .sort((a, b) => a - b)

  const seqFound = findLongestConsecutive(singleRanks, 5)
  for (const seq of seqFound) {
    const seqCards: Card[] = []
    for (const r of seq) {
      seqCards.push(remaining.get(r)![0])
      const leftover = remaining.get(r)!.slice(1)
      if (leftover.length > 0) remaining.set(r, leftover)
      else remaining.delete(r)
    }
    plays.push({
      type: CardType.SEQUENCE, cards: seqCards,
      mainRank: seq[0], length: seq.length
    })
  }

  // 5. 找连对
  const pairRanks = [...remaining.entries()]
    .filter(([r, c]) => c.length >= 2 && r >= 3 && r <= 14)
    .map(([r]) => r)
    .sort((a, b) => a - b)

  const pairSeqFound = findLongestConsecutive(pairRanks, 3)
  for (const seq of pairSeqFound) {
    const seqCards: Card[] = []
    for (const r of seq) {
      seqCards.push(...remaining.get(r)!.slice(0, 2))
      const leftover = remaining.get(r)!.slice(2)
      if (leftover.length > 0) remaining.set(r, leftover)
      else remaining.delete(r)
    }
    plays.push({
      type: CardType.SEQUENCE_PAIR, cards: seqCards,
      mainRank: seq[0], length: seq.length
    })
  }

  // 6. 剩余三张 → 三带一/三带二
  for (const [rank, cs] of [...remaining.entries()]) {
    if (cs.length === 3) {
      const triple = cs.slice(0, 3)
      remaining.delete(rank)
      // 找一个单牌或对子带上
      const singles = [...remaining.entries()].filter(([, c]) => c.length === 1)
      const pairs = [...remaining.entries()].filter(([, c]) => c.length === 2)
      if (pairs.length > 0) {
        const [pr, pc] = pairs[0]
        plays.push({
          type: CardType.TRIPLE_WITH_PAIR,
          cards: [...triple, ...pc],
          mainRank: rank
        })
        remaining.delete(pr)
      } else if (singles.length > 0) {
        const [sr, sc] = singles[0]
        plays.push({
          type: CardType.TRIPLE_WITH_SINGLE,
          cards: [...triple, sc[0]],
          mainRank: rank
        })
        remaining.delete(sr)
      } else {
        plays.push({ type: CardType.TRIPLE, cards: triple, mainRank: rank })
      }
    }
  }

  // 7. 炸弹不拆（除非只剩炸弹了）
  for (const bRank of bombs) {
    if (remaining.has(bRank) && remaining.get(bRank)!.length === 4) {
      plays.push({
        type: CardType.BOMB,
        cards: remaining.get(bRank)!,
        mainRank: bRank
      })
      remaining.delete(bRank)
    }
  }

  // 8. 剩余对子
  for (const [rank, cs] of [...remaining.entries()]) {
    if (cs.length >= 2) {
      plays.push({ type: CardType.PAIR, cards: cs.slice(0, 2), mainRank: rank })
      const leftover = cs.slice(2)
      if (leftover.length > 0) remaining.set(rank, leftover)
      else remaining.delete(rank)
    }
  }

  // 9. 剩余单牌
  for (const [rank, cs] of remaining) {
    for (const c of cs) {
      plays.push({ type: CardType.SINGLE, cards: [c], mainRank: rank })
    }
  }

  return { groups: plays, totalMoves: plays.length }
}

/** 找出连续序列（贪心取最长） */
function findLongestConsecutive(sortedRanks: number[], minLen: number): number[][] {
  const results: number[][] = []
  const used = new Set<number>()

  // 贪心：从最长的连续序列开始取
  let sequences: number[][] = []
  let current: number[] = []
  for (const r of sortedRanks) {
    if (current.length === 0 || r === current[current.length - 1] + 1) {
      current.push(r)
    } else {
      if (current.length >= minLen) sequences.push([...current])
      current = [r]
    }
  }
  if (current.length >= minLen) sequences.push(current)

  // 按长度降序排列
  sequences.sort((a, b) => b.length - a.length)
  for (const seq of sequences) {
    const valid = seq.filter(r => !used.has(r))
    // 重新找连续
    let sub: number[] = []
    for (const r of valid) {
      if (sub.length === 0 || r === sub[sub.length - 1] + 1) {
        sub.push(r)
      } else {
        if (sub.length >= minLen) {
          results.push([...sub])
          sub.forEach(r2 => used.add(r2))
        }
        sub = [r]
      }
    }
    if (sub.length >= minLen) {
      results.push(sub)
      sub.forEach(r2 => used.add(r2))
    }
  }

  return results
}

/**
 * 评估手牌强度（分数越高越强）
 */
export function evaluateHand(cards: Card[]): number {
  const analysis = analyzeHand(cards)
  let score = 100

  // 出牌次数越少越好
  score -= analysis.totalMoves * 10

  // 炸弹和火箭加分
  for (const g of analysis.groups) {
    if (g.type === CardType.ROCKET) score += 30
    if (g.type === CardType.BOMB) score += 20
  }

  // 大牌加分
  const counts = countByRank(cards)
  if (counts.has(17)) score += 10  // 大王
  if (counts.has(16)) score += 8   // 小王
  if (counts.has(15)) score += 5   // 2

  return score
}
```

**Step 2: Commit**

```bash
git add src/logic/ai/handAnalyzer.ts
git commit -m "feat: implement hand analyzer with greedy decomposition"
```

---

## Task 6: AI 策略引擎 - 记牌器与出牌决策

**Files:**
- Create: `src/logic/ai/cardCounter.ts`
- Create: `src/logic/ai/playDecider.ts`
- Create: `src/logic/ai/index.ts`

**Step 1: 实现记牌器 cardCounter.ts**

```typescript
// src/logic/ai/cardCounter.ts
import type { Card, TurnRecord } from '../../types/card'
import { countByRank } from '../cardType'

export class CardCounter {
  /** 全部54张牌每个rank的初始数量 */
  private totalCounts: Map<number, number>
  /** 已出的牌 */
  private playedCards: Card[] = []
  /** 每个rank已出数量 */
  private playedCounts: Map<number, number> = new Map()

  constructor() {
    this.totalCounts = new Map()
    for (let r = 3; r <= 15; r++) this.totalCounts.set(r, 4)
    this.totalCounts.set(16, 1) // 小王
    this.totalCounts.set(17, 1) // 大王
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

  /** 获取某rank剩余数量（全场，包含自己手牌中未出的） */
  getRemainingCount(rank: number): number {
    return (this.totalCounts.get(rank) || 0) - (this.playedCounts.get(rank) || 0)
  }

  /** 获取未出的牌总数 */
  getTotalRemaining(): number {
    let total = 0
    for (const [rank] of this.totalCounts) {
      total += this.getRemainingCount(rank)
    }
    return total
  }

  /** 判断某rank是否已经全部出完 */
  isRankExhausted(rank: number): boolean {
    return this.getRemainingCount(rank) === 0
  }

  /** 获取场上剩余的炸弹可能数 */
  getPossibleBombCount(myCards: Card[]): number {
    const myCounts = countByRank(myCards)
    let bombCount = 0
    for (let r = 3; r <= 15; r++) {
      const remaining = this.getRemainingCount(r)
      const myCount = myCounts.get(r) || 0
      const othersHave = remaining - myCount
      if (othersHave === 4) bombCount++ // 对手可能有完整炸弹
    }
    return bombCount
  }
}
```

**Step 2: 实现出牌决策器 playDecider.ts**

```typescript
// src/logic/ai/playDecider.ts
import type { Card, CardPlay, PlayerState } from '../../types/card'
import { CardType } from '../../types/card'
import { findValidPlays, findAllPlays } from '../cardType'
import { canBeat } from '../compare'
import { analyzeHand, evaluateHand } from './handAnalyzer'
import { CardCounter } from './cardCounter'

export class PlayDecider {
  private counter: CardCounter

  constructor(counter: CardCounter) {
    this.counter = counter
  }

  /**
   * AI 决定出什么牌
   * @param hand AI的手牌
   * @param lastPlay 上一手牌（null表示主动出牌）
   * @param lastPlayerIndex 上一手牌的出牌人
   * @param myIndex 自己的位置
   * @param landlordIndex 地主位置
   * @param players 所有玩家状态
   */
  decide(
    hand: Card[],
    lastPlay: CardPlay | null,
    lastPlayerIndex: number,
    myIndex: number,
    landlordIndex: number,
    players: PlayerState[],
  ): CardPlay | null {
    const isLandlord = myIndex === landlordIndex
    const isTeammate = !isLandlord && lastPlayerIndex !== landlordIndex && lastPlayerIndex !== myIndex

    // 主动出牌
    if (!lastPlay || lastPlayerIndex === myIndex) {
      return this.decideActive(hand, isLandlord, landlordIndex, players)
    }

    // 被动跟牌
    return this.decidePassive(hand, lastPlay, isLandlord, isTeammate, landlordIndex, players)
  }

  /** 主动出牌策略 */
  private decideActive(
    hand: Card[],
    isLandlord: boolean,
    landlordIndex: number,
    players: PlayerState[],
  ): CardPlay {
    const analysis = analyzeHand(hand)

    // 如果只剩一手牌，直接出
    if (analysis.groups.length === 1) {
      return analysis.groups[0]
    }

    // 对手牌少时，优先出大牌控制
    const opponentMinCards = this.getOpponentMinCards(isLandlord, landlordIndex, players)
    if (opponentMinCards <= 2) {
      // 对手快赢了，出炸弹/大牌
      const bombs = analysis.groups.filter(
        g => g.type === CardType.BOMB || g.type === CardType.ROCKET
      )
      if (bombs.length > 0) return bombs[0]
    }

    // 正常策略：先出最弱的牌组
    const sorted = [...analysis.groups]
      .filter(g => g.type !== CardType.BOMB && g.type !== CardType.ROCKET)
      .sort((a, b) => {
        // 优先出单牌和小对子
        const typeOrder = this.getTypeOrder(a.type) - this.getTypeOrder(b.type)
        if (typeOrder !== 0) return typeOrder
        return a.mainRank - b.mainRank
      })

    return sorted[0] || analysis.groups[0]
  }

  /** 被动跟牌策略 */
  private decidePassive(
    hand: Card[],
    lastPlay: CardPlay,
    isLandlord: boolean,
    isTeammate: boolean,
    landlordIndex: number,
    players: PlayerState[],
  ): CardPlay | null {
    const validPlays = findValidPlays(hand, lastPlay)
    if (validPlays.length === 0) return null

    // 队友出的牌，考虑是否跟
    if (isTeammate) {
      // 队友出的牌对手没跟，不用强跟
      return null
    }

    // 对手出的牌，需要跟
    const opponentMinCards = this.getOpponentMinCards(isLandlord, landlordIndex, players)

    // 对手快赢了，必须跟
    if (opponentMinCards <= 3) {
      // 出最小的能赢的牌
      return this.getSmallestPlay(validPlays)
    }

    // 正常情况，出最小的能赢的非炸弹牌
    const nonBombs = validPlays.filter(
      p => p.type !== CardType.BOMB && p.type !== CardType.ROCKET
    )
    if (nonBombs.length > 0) {
      return this.getSmallestPlay(nonBombs)
    }

    // 只有炸弹能赢，评估是否值得
    if (hand.length <= 6) {
      // 手牌不多了，炸弹也出
      return this.getSmallestPlay(validPlays)
    }

    // 不出（保留炸弹）
    return null
  }

  /** 获取对手最少手牌数 */
  private getOpponentMinCards(isLandlord: boolean, landlordIndex: number, players: PlayerState[]): number {
    if (isLandlord) {
      // 地主的对手是两个农民
      return Math.min(
        ...players.filter((_, i) => i !== landlordIndex).map(p => p.cards.length)
      )
    } else {
      // 农民的对手是地主
      return players[landlordIndex].cards.length
    }
  }

  /** 出最小的牌 */
  private getSmallestPlay(plays: CardPlay[]): CardPlay {
    return plays.sort((a, b) => a.mainRank - b.mainRank)[0]
  }

  /** 牌型出牌优先级（越小越优先出） */
  private getTypeOrder(type: CardType): number {
    const order: Record<CardType, number> = {
      [CardType.SINGLE]: 1,
      [CardType.PAIR]: 2,
      [CardType.TRIPLE]: 3,
      [CardType.TRIPLE_WITH_SINGLE]: 4,
      [CardType.TRIPLE_WITH_PAIR]: 5,
      [CardType.SEQUENCE]: 3,
      [CardType.SEQUENCE_PAIR]: 4,
      [CardType.SEQUENCE_TRIPLE]: 5,
      [CardType.PLANE_WITH_SINGLES]: 6,
      [CardType.PLANE_WITH_PAIRS]: 7,
      [CardType.FOUR_WITH_TWO_SINGLES]: 8,
      [CardType.FOUR_WITH_TWO_PAIRS]: 9,
      [CardType.BOMB]: 99,
      [CardType.ROCKET]: 100,
    }
    return order[type] || 50
  }

  /**
   * AI 决定是否叫地主
   * 评估手牌强度
   */
  decideBid(hand: Card[]): boolean {
    const score = evaluateHand(hand)
    // 分数大于60才叫地主
    return score > 60
  }
}
```

**Step 3: 创建 AI 模块入口 index.ts**

```typescript
// src/logic/ai/index.ts
export { CardCounter } from './cardCounter'
export { PlayDecider } from './playDecider'
export { analyzeHand, evaluateHand } from './handAnalyzer'
```

**Step 4: Commit**

```bash
git add src/logic/ai/
git commit -m "feat: implement AI engine with card counter and play decider"
```

---

## Task 7: Pinia 游戏 Store

**Files:**
- Create: `src/stores/game.ts`

**Step 1: 实现游戏 store**

```typescript
// src/stores/game.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Card, CardPlay, PlayerState, GamePhase, TurnRecord } from '../types/card'
import { deal, sortCards } from '../logic/deck'
import { identifyCardType, findValidPlays } from '../logic/cardType'
import { canBeat } from '../logic/compare'
import { CardCounter, PlayDecider } from '../logic/ai'

export const useGameStore = defineStore('game', () => {
  // 状态
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
  const bombCount = ref(0)  // 炸弹计数（用于翻倍）
  const winner = ref<'landlord' | 'farmer' | null>(null)
  const selectedCards = ref<Set<number>>(new Set())  // 选中的card id
  const hintIndex = ref(-1)  // 当前提示索引
  const hintPlays = ref<CardPlay[]>([])  // 提示列表
  const bidQueue = ref<number[]>([])  // 叫地主队列
  const currentBidder = ref(0)
  const bidPassed = ref<boolean[]>([false, false, false])
  const showLandlordCards = ref(false)
  const message = ref('')  // 显示消息

  // AI 引擎
  const counter = new CardCounter()
  const decider = new PlayDecider(counter)

  // 计算属性
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const isPlayerTurn = computed(() => currentPlayerIndex.value === 0 && phase.value === 'playing')
  const playerCards = computed(() => players.value[0].cards)

  /** 开始新游戏 */
  function startGame(): void {
    // 重置状态
    phase.value = 'dealing'
    winner.value = null
    bombCount.value = 0
    passCount.value = 0
    turnHistory.value = []
    lastPlay.value = null
    selectedCards.value = new Set()
    hintIndex.value = -1
    hintPlays.value = []
    showLandlordCards.value = false
    message.value = ''
    counter.reset()

    // 发牌
    const result = deal()
    players.value[0].cards = result.hands[0]
    players.value[1].cards = result.hands[1]
    players.value[2].cards = result.hands[2]
    landlordCards.value = result.landlordCards

    for (let i = 0; i < 3; i++) {
      players.value[i].isLandlord = false
    }
    landlordIndex.value = -1

    // 随机决定谁先叫地主
    currentBidder.value = Math.floor(Math.random() * 3)
    bidPassed.value = [false, false, false]

    // 短延迟后进入叫地主
    setTimeout(() => {
      phase.value = 'bidding'
      processBidding()
    }, 500)
  }

  /** 处理叫地主流程 */
  function processBidding(): void {
    if (phase.value !== 'bidding') return

    // 检查是否所有人都不叫
    if (bidPassed.value.every(v => v)) {
      // 全部不叫，重新发牌
      message.value = '没人叫地主，重新发牌...'
      setTimeout(() => startGame(), 1500)
      return
    }

    const idx = currentBidder.value

    if (bidPassed.value[idx]) {
      // 跳过已pass的
      currentBidder.value = (idx + 1) % 3
      processBidding()
      return
    }

    if (players.value[idx].isAI) {
      // AI 决定是否叫地主
      setTimeout(() => {
        const wantBid = decider.decideBid(players.value[idx].cards)
        if (wantBid) {
          setLandlord(idx)
        } else {
          bidPassed.value[idx] = true
          message.value = `${players.value[idx].name} 不叫`

          // 检查是否只剩一人未pass
          const remaining = bidPassed.value.filter(v => !v)
          if (remaining.length === 1) {
            const lastIdx = bidPassed.value.findIndex(v => !v)
            setTimeout(() => setLandlord(lastIdx), 800)
            return
          }

          currentBidder.value = (idx + 1) % 3
          setTimeout(() => processBidding(), 800)
        }
      }, 1000)
    }
    // 如果是玩家，等待 UI 调用 playerBid
  }

  /** 玩家叫地主/不叫 */
  function playerBid(bid: boolean): void {
    if (phase.value !== 'bidding' || currentBidder.value !== 0) return

    if (bid) {
      setLandlord(0)
    } else {
      bidPassed.value[0] = true
      message.value = '你不叫'

      const remaining = bidPassed.value.filter(v => !v)
      if (remaining.length === 1) {
        const lastIdx = bidPassed.value.findIndex(v => !v)
        setTimeout(() => setLandlord(lastIdx), 800)
        return
      }

      currentBidder.value = (currentBidder.value + 1) % 3
      setTimeout(() => processBidding(), 800)
    }
  }

  /** 设定地主 */
  function setLandlord(idx: number): void {
    landlordIndex.value = idx
    players.value[idx].isLandlord = true
    players.value[idx].cards = sortCards([
      ...players.value[idx].cards,
      ...landlordCards.value
    ])
    showLandlordCards.value = true
    message.value = `${players.value[idx].name} 是地主！`

    setTimeout(() => {
      phase.value = 'playing'
      currentPlayerIndex.value = idx
      message.value = ''
      if (players.value[idx].isAI) {
        processAITurn()
      }
    }, 1500)
  }

  /** 处理 AI 出牌 */
  function processAITurn(): void {
    if (phase.value !== 'playing') return
    const idx = currentPlayerIndex.value
    if (!players.value[idx].isAI) return

    setTimeout(() => {
      const aiHand = players.value[idx].cards
      const currentLastPlay = (lastPlay.value && lastPlay.value.playerIndex !== idx)
        ? lastPlay.value.play : null

      const play = decider.decide(
        aiHand,
        currentLastPlay,
        lastPlay.value?.playerIndex ?? idx,
        idx,
        landlordIndex.value,
        players.value,
      )

      if (play) {
        executePlay(idx, play)
      } else {
        executePass(idx)
      }
    }, 1000)
  }

  /** 执行出牌 */
  function executePlay(playerIdx: number, play: CardPlay): void {
    // 从手牌中移除
    const playCardIds = new Set(play.cards.map(c => c.id))
    players.value[playerIdx].cards = players.value[playerIdx].cards.filter(
      c => !playCardIds.has(c.id)
    )

    // 更新记牌器
    counter.recordPlay(play.cards)

    // 记录炸弹
    if (play.type === 'BOMB' || play.type === 'ROCKET') {
      bombCount.value++
    }

    // 更新状态
    lastPlay.value = { play, playerIndex: playerIdx }
    passCount.value = 0
    turnHistory.value.push({ playerIndex: playerIdx, play })
    message.value = `${players.value[playerIdx].name} 出了 ${describePlay(play)}`

    // 检查是否赢了
    if (players.value[playerIdx].cards.length === 0) {
      endGame(playerIdx)
      return
    }

    // 下一个玩家
    nextTurn()
  }

  /** 执行 pass */
  function executePass(playerIdx: number): void {
    passCount.value++
    turnHistory.value.push({ playerIndex: playerIdx, play: null })
    message.value = `${players.value[playerIdx].name} 不出`

    // 两家都pass，当前出牌人重新获得主动权
    if (passCount.value >= 2) {
      passCount.value = 0
      lastPlay.value = null
    }

    nextTurn()
  }

  /** 下一轮 */
  function nextTurn(): void {
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % 3

    setTimeout(() => {
      if (players.value[currentPlayerIndex.value].isAI) {
        processAITurn()
      } else {
        // 玩家回合，重置选择和提示
        selectedCards.value = new Set()
        hintIndex.value = -1
        hintPlays.value = []
      }
    }, 800)
  }

  /** 玩家出牌 */
  function playerPlay(): boolean {
    if (!isPlayerTurn.value) return false

    const selected = players.value[0].cards.filter(c => selectedCards.value.has(c.id))
    if (selected.length === 0) return false

    const play = identifyCardType(selected)
    if (!play) {
      message.value = '无效牌型！'
      return false
    }

    // 如果有上家出牌，检查是否能打过
    const currentLastPlay = (lastPlay.value && lastPlay.value.playerIndex !== 0)
      ? lastPlay.value.play : null

    if (currentLastPlay && !canBeat(play, currentLastPlay)) {
      message.value = '打不过上家！'
      return false
    }

    executePlay(0, play)
    return true
  }

  /** 玩家 pass */
  function playerPass(): boolean {
    if (!isPlayerTurn.value) return false
    // 主动出牌时不能pass
    if (!lastPlay.value || lastPlay.value.playerIndex === 0) {
      message.value = '你必须出牌！'
      return false
    }
    executePass(0)
    return true
  }

  /** 提示 */
  function showHint(): void {
    if (!isPlayerTurn.value) return

    const currentLastPlay = (lastPlay.value && lastPlay.value.playerIndex !== 0)
      ? lastPlay.value.play : null

    if (hintPlays.value.length === 0) {
      hintPlays.value = findValidPlays(players.value[0].cards, currentLastPlay)
    }

    if (hintPlays.value.length === 0) {
      message.value = '没有可出的牌'
      return
    }

    hintIndex.value = (hintIndex.value + 1) % hintPlays.value.length
    const hint = hintPlays.value[hintIndex.value]
    selectedCards.value = new Set(hint.cards.map(c => c.id))
  }

  /** 切换选牌 */
  function toggleCard(cardId: number): void {
    if (!isPlayerTurn.value) return
    const newSet = new Set(selectedCards.value)
    if (newSet.has(cardId)) {
      newSet.delete(cardId)
    } else {
      newSet.add(cardId)
    }
    selectedCards.value = newSet
    // 重置提示
    hintIndex.value = -1
    hintPlays.value = []
  }

  /** 结束游戏 */
  function endGame(winnerIdx: number): void {
    phase.value = 'result'
    const isLandlordWin = winnerIdx === landlordIndex.value
    if (isLandlordWin) {
      winner.value = 'landlord'
    } else {
      winner.value = 'farmer'
    }
    const multiplier = Math.pow(2, bombCount.value)
    message.value = isLandlordWin
      ? `地主 ${players.value[winnerIdx].name} 赢了！(${multiplier}倍)`
      : `农民赢了！(${multiplier}倍)`
  }

  /** 描述一手牌 */
  function describePlay(play: CardPlay): string {
    return play.cards.map(c => c.display).join(' ')
  }

  return {
    // 状态
    phase, players, landlordIndex, currentPlayerIndex,
    landlordCards, lastPlay, passCount, turnHistory,
    bombCount, winner, selectedCards, showLandlordCards,
    message, currentBidder, bidPassed,
    // 计算属性
    currentPlayer, isPlayerTurn, playerCards,
    // 方法
    startGame, playerBid, playerPlay, playerPass,
    showHint, toggleCard,
  }
})
```

**Step 2: Commit**

```bash
git add src/stores/game.ts
git commit -m "feat: implement Pinia game store with full game flow"
```

---

## Task 8: UI组件 - CardItem 和 PlayerHand

**Files:**
- Create: `src/components/CardItem.vue`
- Create: `src/components/PlayerHand.vue`

**Step 1: 实现 CardItem.vue（纯CSS扑克牌）**

单张扑克牌的渲染。宽 60px，高 90px。白色背景，圆角，显示花色符号和牌面值。
- 红心/方块为红色字体
- 黑桃/梅花为黑色字体
- 王牌特殊显示
- 卡背为深色+花纹
- 选中状态上移 20px
- hover 有轻微阴影

**Step 2: 实现 PlayerHand.vue**

根据玩家类型渲染：
- 人类玩家（底部）：显示牌面，可点击选择
- AI玩家：显示卡背，显示剩余牌数
- 牌之间有 -30px 的 margin 重叠效果

**Step 3: Commit**

```bash
git add src/components/CardItem.vue src/components/PlayerHand.vue
git commit -m "feat: implement CardItem and PlayerHand components"
```

---

## Task 9: UI组件 - 出牌区、叫地主、信息面板

**Files:**
- Create: `src/components/PlayedCards.vue`
- Create: `src/components/BidPanel.vue`
- Create: `src/components/InfoPanel.vue`

**Step 1: 实现 PlayedCards.vue**

展示上一次出牌。居中显示，卡片平铺（不重叠）。下方显示出牌人姓名和牌型描述。当某玩家pass时显示"不出"。

**Step 2: 实现 BidPanel.vue**

叫地主阶段的面板：
- 显示当前轮到谁叫地主
- 玩家轮到时显示"叫地主"和"不叫"按钮
- AI的决定以文字方式展示

**Step 3: 实现 InfoPanel.vue**

游戏信息面板：
- 显示底牌（地主确定后翻开）
- 显示当前回合、谁是地主
- 显示炸弹计数（翻倍）
- 显示各玩家剩余牌数

**Step 4: Commit**

```bash
git add src/components/PlayedCards.vue src/components/BidPanel.vue src/components/InfoPanel.vue
git commit -m "feat: implement PlayedCards, BidPanel, and InfoPanel components"
```

---

## Task 10: 主界面组装与结算

**Files:**
- Create: `src/components/GameBoard.vue`
- Create: `src/components/ResultDialog.vue`
- Modify: `src/App.vue`
- Modify: `src/style.css`

**Step 1: 实现 GameBoard.vue**

主游戏界面布局：
```
┌──────────────────────────────────────┐
│            InfoPanel                 │
│   ┌────────────────────────────┐     │
│   │      AI-2 (top)            │     │
│   │      [卡背] 剩余:N         │     │
│   ├──────┬────────────┬────────┤     │
│   │AI-1  │  PlayedCards│  AI-2  │     │
│   │(left)│  出牌区域   │ (right)│     │
│   ├──────┴────────────┴────────┤     │
│   │    BidPanel (叫地主阶段)    │     │
│   │    玩家手牌 PlayerHand      │     │
│   │    [出牌] [不出] [提示]     │     │
│   └────────────────────────────┘     │
│          ResultDialog               │
└──────────────────────────────────────┘
```

使用 CSS Grid 实现布局。游戏桌面背景为深绿色 `#1a5c2e`。

**Step 2: 实现 ResultDialog.vue**

游戏结束弹窗：
- 显示胜负结果
- 显示炸弹翻倍
- "再来一局"按钮

**Step 3: 修改 App.vue**

替换默认内容，改为游戏启动页面：
- 标题"斗地主"
- "开始游戏"按钮
- 游戏开始后显示 GameBoard

**Step 4: 修改 style.css**

替换默认样式为游戏全局样式：
- 移除默认 Vite 模板样式
- 设置 body 全屏、overflow hidden
- 游戏桌面背景色
- 按钮基础样式（金色边框、深色背景）
- 字体设置

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement GameBoard, ResultDialog, and final integration"
```

---

## Task 11: 最终调试与打磨

**Step 1: 启动开发服务器**

Run: `pnpm dev`

**Step 2: 浏览器中测试完整流程**

- 发牌是否正确（54张牌分配无遗漏）
- 叫地主流程是否正常
- 出牌验证是否准确
- AI是否正常出牌
- 胜负判定是否正确
- 重新开局是否正常

**Step 3: 修复发现的问题**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: polish game and fix bugs from integration testing"
```

---

## 执行顺序依赖

```
Task 1 (基础) → Task 2 (发牌) → Task 3 (牌型) → Task 4 (比较)
                                      ↓
Task 5 (手牌分析) → Task 6 (AI决策) → Task 7 (Store)
                                          ↓
Task 8 (卡牌组件) → Task 9 (面板组件) → Task 10 (主界面) → Task 11 (调试)
```

Tasks 2-4 和 Tasks 5-6 的逻辑层可以并行开发，但都需要先完成 Task 1。
