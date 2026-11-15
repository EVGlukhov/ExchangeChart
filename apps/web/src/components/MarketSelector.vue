<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart'

const market = defineModel<Market>({ required: true })
</script>

<template>
  <label class="text-binance-muted flex items-center gap-3 text-sm">
    <span>Market</span>
    <select
      v-model="market"
      aria-label="Select market"
      class="border-binance-border bg-binance-surface text-binance-text focus:border-binance-accent focus:ring-binance-accent/20 rounded-md border px-3 py-2 text-sm shadow-sm transition outline-none hover:border-gray-600 focus:ring-2"
    >
      <option v-for="item in MARKETS" :key="item.symbol" :value="item.symbol">
        {{ item.label }}
      </option>
    </select>
  </label>
</template>
