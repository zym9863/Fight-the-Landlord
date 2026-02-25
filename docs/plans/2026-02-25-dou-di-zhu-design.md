# 斗地主游戏设计文档

## 概述

单机斗地主游戏，玩家对战两个AI，纯前端实现。

- **技术栈**：Vue 3 + TypeScript + Pinia + Vite + pnpm
- **UI风格**：简约风格，CSS绘制扑克牌
- **AI难度**：高级（记牌、拆牌优化、动态策略）

## 架构

```
src/
├── types/card.ts           # 类型定义
├── logic/
│   ├── deck.ts             # 发牌、洗牌
│   ├── cardType.ts         # 牌型识别
│   ├── compare.ts          # 牌型比较
│   └── ai.ts               # AI策略引擎
├── stores/game.ts          # Pinia游戏状态
├── composables/useCardSelect.ts  # 选牌交互
├── components/
│   ├── GameBoard.vue       # 主界面
│   ├── PlayerHand.vue      # 手牌区
│   ├── CardItem.vue        # 单张牌
│   ├── PlayedCards.vue     # 出牌区
│   ├── InfoPanel.vue       # 信息面板
│   ├── BidPanel.vue        # 叫地主面板
│   └── ResultDialog.vue    # 结算弹窗
└── App.vue
```

逻辑层（logic/）纯TypeScript，不依赖Vue，可独立测试。

## 数据模型

### Card

```typescript
type Suit = 'spade' | 'heart' | 'club' | 'diamond'

interface Card {
  suit: Suit | 'joker'
  rank: number      // 3-17: 3..K=13, A=14, 2=15, 小王=16, 大王=17
  display: string   // "3","J","Q","K","A","2","🃏","👑"
}
```

### 牌型

SINGLE, PAIR, TRIPLE, TRIPLE_WITH_SINGLE, TRIPLE_WITH_PAIR, SEQUENCE, SEQUENCE_PAIR, SEQUENCE_TRIPLE, PLANE_WITH_SINGLES, PLANE_WITH_PAIRS, FOUR_WITH_TWO_SINGLES, FOUR_WITH_TWO_PAIRS, BOMB, ROCKET

### GameState (Pinia)

```typescript
interface GameState {
  phase: 'dealing' | 'bidding' | 'playing' | 'result'
  players: [PlayerState, PlayerState, PlayerState]
  landlordIndex: number
  currentPlayerIndex: number
  landlordCards: Card[]
  lastPlay: { cards: Card[], playerIndex: number } | null
  passCount: number
  turnHistory: TurnRecord[]
}
```

## AI策略引擎

三大模块：

1. **记牌器**：跟踪已出牌，推断对手牌力
2. **拆牌优化器**：贪心+回溯搜索最优拆牌组合，目标最少出牌次数
3. **出牌决策器**：主动出牌出弱牌、被动跟牌评估价值、农民协作配合

## UI布局

三人牌局布局：AI-1(左)、AI-2(上)、玩家(下)。中央为出牌区和底牌展示区。玩家手牌点击选中上移，操作按钮：出牌、不出、提示。

## 游戏流程

1. 发牌 → 2. 叫地主（轮流竞叫）→ 3. 底牌分配 → 4. 轮流出牌 → 5. 结算
