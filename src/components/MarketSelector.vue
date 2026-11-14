<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart'

const market = defineModel<Market>({ required: true })
</script>

<template>
  <label class="flex items-center gap-3 text-sm text-binance-muted">
    <span>Market</span>
    <select
      v-model="market"
      aria-label="Select market"
      class="rounded-md border border-binance-border bg-binance-surface px-3 py-2 text-sm text-binance-text shadow-sm transition outline-none hover:border-gray-600 focus:border-binance-accent focus:ring-2 focus:ring-binance-accent/20"
    >
      <option v-for="item in MARKETS" :key="item.symbol" :value="item.symbol">
        {{ item.label }}
      </option>
    </select>
  </label>
</template>
