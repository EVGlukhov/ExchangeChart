<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart'

const market = defineModel<Market>({ required: true })
</script>

<template>
  <label
    class="text-binance-muted flex min-w-0 items-center gap-2 text-[10px] font-medium tracking-wider uppercase"
  >
    <span>Market</span>
    <select
      v-model="market"
      aria-label="Select market"
      class="border-binance-border bg-binance-surface text-binance-text focus:border-binance-accent focus:ring-binance-accent/20 min-w-0 rounded-xl border px-3 py-2.5 text-sm font-semibold tracking-normal shadow-sm transition outline-none focus:ring-2"
    >
      <option v-for="item in MARKETS" :key="item.symbol" :value="item.symbol">
        {{ item.label }}
      </option>
    </select>
  </label>
</template>
