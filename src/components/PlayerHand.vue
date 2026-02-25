<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '../types/card'
import CardItem from './CardItem.vue'

const props = withDefaults(
  defineProps<{
    player: PlayerState
    position: 'bottom' | 'left' | 'top'
    selectedCards?: Set<number>
    interactive?: boolean
  }>(),
  {
    selectedCards: () => new Set<number>(),
    interactive: false,
  },
)

const emit = defineEmits<{
  cardClick: [cardId: number]
}>()

const displayCards = computed(() => props.player.cards)

const overlap = computed(() => (props.position === 'bottom' ? -30 : -40))
</script>

<template>
  <div class="player-hand" :class="position">
    <div class="player-name">
      {{ player.name }}
      <span v-if="player.isLandlord" class="landlord-badge">地主</span>
    </div>
    <div class="cards-container">
      <CardItem
        v-for="(card, index) in displayCards"
        :key="card.id"
        :card="card"
        :face-down="player.isAI"
        :selected="selectedCards.has(card.id)"
        :clickable="interactive"
        :style="{ marginLeft: index > 0 ? overlap + 'px' : '0' }"
        @click="emit('cardClick', card.id)"
      />
    </div>
    <div v-if="player.isAI" class="card-count">剩余: {{ player.cards.length }}</div>
  </div>
</template>

<style scoped>
.player-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.player-hand.top {
  flex-direction: column-reverse;
}

.player-hand.left {
  flex-direction: column;
  align-items: flex-start;
}

.cards-container {
  display: flex;
  align-items: center;
  position: relative;
  padding: 12px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.1);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.player-name {
  color: var(--color-text-main);
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.landlord-badge {
  background: linear-gradient(135deg, var(--color-gold-light), var(--color-gold-dark));
  color: var(--color-bg-dark);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
}

.landlord-badge::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
  transform: skewX(-20deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 200%; }
  100% { left: 200%; }
}

.card-count {
  color: var(--color-gold);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
