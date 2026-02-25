# Fight the Landlord (Dou Di Zhu)

[中文](README.md)

A single-player Dou Di Zhu game where a human player competes against two AI opponents, implemented entirely in the frontend.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Pinia** - State management
- **Vite** - Build tool
- **pnpm** - Package manager

## Features

- 🎮 Full Dou Di Zhu gameplay (deal, bid, play cards, scoring)
- 🤖 Advanced AI opponents (card counting, splitting optimization, dynamic strategy)
- 🎨 Minimalist UI with cards drawn in pure CSS
- 📱 Responsive design

## Project Structure

```
src/
├── types/card.ts           # Type definitions
├── logic/
│   ├── deck.ts             # Dealing and shuffling
│   ├── cardType.ts         # Hand type recognition
│   ├── compare.ts          # Hand comparison
│   └── ai/                 # AI strategy engine
│       ├── cardCounter.ts  # Card counter
│       ├── handAnalyzer.ts # Split optimizer
│       └── playDecider.ts  # Play decision maker
├── stores/game.ts          # Pinia game state
├── components/
│   ├── GameBoard.vue       # Main interface
│   ├── PlayerHand.vue      # Player hand area
│   ├── CardItem.vue        # Single card
│   ├── PlayedCards.vue     # Played cards area
│   ├── InfoPanel.vue       # Info panel
│   ├── BidPanel.vue        # Bidding panel
│   └── ResultDialog.vue    # Result dialog
└── App.vue
```

## Quick Start

### Requirements

- Node.js 18+
- pnpm 8+

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Game Rules

### Hand Types

- **Single**: any one card
- **Pair**: two cards of the same rank
- **Three of a Kind**: three cards of the same rank
- **Three with One**: three of a kind plus a single card
- **Three with Pair**: three of a kind plus a pair
- **Straight**: five or more consecutive ranks (excluding 2 and jokers)
- **Consecutive Pairs**: three or more consecutive pairs (excluding 2 and jokers)
- **Airplane**: two or more consecutive three-of-a-kinds (excluding 2 and jokers)
- **Airplane with Wings**: airplane plus the same number of single cards or pairs
- **Four with Two**: four of a kind plus two singles or two pairs
- **Bomb**: four of a kind
- **Rocket**: big joker + small joker (highest hand)

### Game Flow

1. **Deal**: each player gets 17 cards, 3 cards remain as the bottom
2. **Bidding**: players bid in turn; highest bidder becomes the landlord
3. **Bottom Cards**: landlord receives the 3 bottom cards
4. **Playing**: landlord leads, turns proceed clockwise
5. **Settlement**: the side that empties their hand first wins

## AI Strategy

The AI engine consists of three modules:

1. **Card Counter**: tracks seen cards and estimates opponent strength
2. **Split Optimizer**: greedy + backtracking search for optimal splitting minimizing turns
3. **Play Decider**: plays weak cards proactively, evaluates passive following, cooperates as farmers

## License

MIT
