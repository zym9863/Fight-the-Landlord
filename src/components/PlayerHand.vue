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
  gap: 8px;
}

.cards-container {
  display: flex;
  align-items: center;
}

.player-name {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.landlord-badge {
  background: #f39c12;
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 4px;
}

.card-count {
  color: #ecf0f1;
  font-size: 13px;
}
</style>
