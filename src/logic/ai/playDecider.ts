// src/logic/ai/playDecider.ts
// AI Play Decider - uses CardCounter and HandAnalyzer to make play decisions

import type { Card, CardPlay, PlayerState } from '../../types/card'
import { CardType } from '../../types/card'
import { findValidPlays } from '../cardType'
import { analyzeHand, evaluateHand } from './handAnalyzer'
import { CardCounter } from './cardCounter'

export class PlayDecider {
  private counter: CardCounter

  constructor(counter: CardCounter) {
    this.counter = counter
  }

  /**
   * Main decision entry point.
   * Returns null to pass, or a CardPlay to play.
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
    const isTeammate =
      !isLandlord && lastPlayerIndex !== landlordIndex && lastPlayerIndex !== myIndex

    // Active play: no outstanding play to beat, or it was my own last play
    if (!lastPlay || lastPlayerIndex === myIndex) {
      return this.decideActive(hand, isLandlord, landlordIndex, players)
    }

    // Passive play: must beat the last play or pass
    return this.decidePassive(hand, lastPlay, isLandlord, isTeammate, landlordIndex, players)
  }

  /**
   * Active play strategy - we lead the round.
   */
  private decideActive(
    hand: Card[],
    isLandlord: boolean,
    landlordIndex: number,
    players: PlayerState[],
  ): CardPlay | null {
    const analysis = analyzeHand(hand)

    // If only 1 group left, play it immediately to win
    if (analysis.totalMoves === 1) {
      return analysis.groups[0]
    }

    // Check if any opponent is close to winning (<=2 cards)
    const opponentAlmostWinning = this.isOpponentAlmostWinning(
      isLandlord,
      landlordIndex,
      players,
      2,
    )

    if (opponentAlmostWinning) {
      // Play bombs or big cards to try to end quickly
      const bombs = analysis.groups.filter(
        g => g.type === CardType.BOMB || g.type === CardType.ROCKET,
      )
      if (bombs.length > 0) {
        return bombs[0]
      }
      // Play the biggest single to control
      const singles = analysis.groups
        .filter(g => g.type === CardType.SINGLE)
        .sort((a, b) => b.mainRank - a.mainRank)
      if (singles.length > 0) {
        return singles[0]
      }
    }

    // Normal strategy: play weakest group first (small singles, then small pairs, etc.)
    // Sort groups by "weakness" - play the least valuable first
    const nonBombs = analysis.groups.filter(
      g => g.type !== CardType.BOMB && g.type !== CardType.ROCKET,
    )

    if (nonBombs.length === 0) {
      // Only bombs/rockets left - play the weakest bomb
      const sorted = [...analysis.groups].sort((a, b) => a.mainRank - b.mainRank)
      return sorted[0]
    }

    // Prefer playing singles first (weakest), then pairs, then others
    const prioritized = [...nonBombs].sort((a, b) => {
      const typePriority = this.getTypePriority(a.type) - this.getTypePriority(b.type)
      if (typePriority !== 0) return typePriority
      return a.mainRank - b.mainRank
    })

    return prioritized[0]
  }

  /**
   * Passive play strategy - must beat the last play or pass.
   */
  private decidePassive(
    hand: Card[],
    lastPlay: CardPlay,
    isLandlord: boolean,
    isTeammate: boolean,
    landlordIndex: number,
    players: PlayerState[],
  ): CardPlay | null {
    // If teammate played and opponents haven't beaten it, don't compete
    if (isTeammate) {
      return null
    }

    // Get all valid plays that can beat lastPlay
    const validPlays = findValidPlays(hand, lastPlay)
    if (validPlays.length === 0) {
      return null // Must pass
    }

    // Separate bombs/rockets from normal plays
    const normalPlays = validPlays.filter(
      p => p.type !== CardType.BOMB && p.type !== CardType.ROCKET,
    )
    const bombPlays = validPlays.filter(
      p => p.type === CardType.BOMB || p.type === CardType.ROCKET,
    )

    // Check if opponent is almost winning (<=3 cards)
    const opponentAlmostWinning = this.isOpponentAlmostWinning(
      isLandlord,
      landlordIndex,
      players,
      3,
    )

    if (opponentAlmostWinning) {
      // Play the smallest valid play to stop them
      if (normalPlays.length > 0) {
        return this.getSmallestPlay(normalPlays)
      }
      // Use bombs if necessary
      if (bombPlays.length > 0) {
        return this.getSmallestPlay(bombPlays)
      }
      return null
    }

    // Normal strategy: play the smallest non-bomb valid play
    if (normalPlays.length > 0) {
      return this.getSmallestPlay(normalPlays)
    }

    // Only bombs available - use them conservatively
    // Only use bombs if hand is small (<=6 cards), otherwise save them
    if (hand.length <= 6 && bombPlays.length > 0) {
      return this.getSmallestPlay(bombPlays)
    }

    // Pass (save bombs for later)
    return null
  }

  /**
   * Decide whether to bid for landlord based on hand strength.
   */
  decideBid(hand: Card[]): boolean {
    const score = evaluateHand(hand)
    return score > 60
  }

  /**
   * Check if any opponent is close to winning (cards count <= threshold).
   */
  private isOpponentAlmostWinning(
    isLandlord: boolean,
    landlordIndex: number,
    players: PlayerState[],
    threshold: number,
  ): boolean {
    for (let i = 0; i < players.length; i++) {
      const isOpponent = isLandlord
        ? i !== landlordIndex // landlord's opponents are the farmers
        : i === landlordIndex // farmer's opponent is the landlord
      if (isOpponent && players[i].cards.length <= threshold && players[i].cards.length > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Get the smallest play from a list of plays (by mainRank).
   */
  private getSmallestPlay(plays: CardPlay[]): CardPlay {
    return plays.reduce((smallest, play) =>
      play.mainRank < smallest.mainRank ? play : smallest,
    )
  }

  /**
   * Get priority for card types when leading (lower = play first).
   * Singles and pairs are played first to reduce hand size with weak cards.
   */
  private getTypePriority(type: CardType): number {
    switch (type) {
      case CardType.SINGLE:
        return 1
      case CardType.PAIR:
        return 2
      case CardType.SEQUENCE:
        return 3
      case CardType.SEQUENCE_PAIR:
        return 4
      case CardType.TRIPLE:
        return 5
      case CardType.TRIPLE_WITH_SINGLE:
        return 6
      case CardType.TRIPLE_WITH_PAIR:
        return 7
      case CardType.SEQUENCE_TRIPLE:
        return 8
      case CardType.PLANE_WITH_SINGLES:
        return 9
      case CardType.PLANE_WITH_PAIRS:
        return 10
      case CardType.FOUR_WITH_TWO_SINGLES:
        return 11
      case CardType.FOUR_WITH_TWO_PAIRS:
        return 12
      case CardType.BOMB:
        return 13
      case CardType.ROCKET:
        return 14
      default:
        return 15
    }
  }
}
