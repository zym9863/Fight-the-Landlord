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
