<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart'
import Typography from './ui/Typography.vue'

const market = defineModel<Market>({ required: true })
</script>

<template>
  <label class="flex min-w-0 items-center gap-2">
    <Typography variant="overline" tone="muted">Market</Typography>
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
