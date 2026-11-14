<script setup lang="ts">
import { computed } from 'vue';
import { useSpotTicker } from '../composables/useSpotTicker.ts';
import type { Market } from '../constants/chart.ts';
import MarketSelector from './MarketSelector.vue'

const market = defineModel<Market>({ required: true })
const { ticker, connected, error } = useSpotTicker(() => market.value)

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumSignificantDigits: 8,
})

const volumeFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2
})

const formatPrice = (value: number | undefined) =>
  value === undefined ? '-' : priceFormatter.format(value)

const formatChange = (value: number | undefined) =>
  value === undefined ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`

const formatVolume = (value: number | undefined) =>
  value === undefined ? '-' : volumeFormatter.format(value)

const changeColor = computed(() => {
  if (ticker.value === null) return 'text-binance-muted'
  return ticker.value.changePercent >= 0
    ? 'text-binance-buy'
    : 'text-binance-sell'
})
</script>

<template>
  <header
    class="overflow-x-auto border-b border-binance-border bg-binance-page text-binance-text"
  >
    <div class="flex min-w-225 items-center gap-8 px-4 py-3">
      <a href="/" class="shrink-0 text-lg font-bold tracking-wide text-binance-accent">
      EXCHANGE<span class="text-binance-text">CHART</span>
    </a>

    <MarketSelector v-model="market" />

    <strong
      class="shrink-0 text-lg tabular-nums"
      :class="changeColor"
    >
      {{ formatPrice(ticker?.lastPrice) }}
    </strong>

    <dl class="ml-auto flex items-center gap-6 text-xs">
      <div>
        <dt class="text-binance-muted">24h Change</dt>
        <dd class="mt-1 tabular-nums" :class="changeColor">
          {{ formatChange(ticker?.changePercent) }}
        </dd>
      </div>

      <div>
        <dt class="text-binance-muted">24h High</dt>
        <dd class="mt-1 tabular-nums">
          {{ formatPrice(ticker?.highPrice) }}
        </dd>
      </div>

      <div>
        <dt class="text-binance-muted">24h Low</dt>
        <dd class="mt-1 tabular-nums">
          {{ formatPrice(ticker?.lowPrice) }}
        </dd>
      </div>

      <div>
        <dt class="text-binance-muted">24h Volume (USDT)</dt>
        <dd class="mt-1 tabular-nums">
          {{ formatVolume(ticker?.quoteVolume) }}
        </dd>
      </div>

      <div
        class="flex items-center gap-1.5 text-binance-muted"
        :title="error || (connected ? 'Connected to Binance Spot' : 'Connecting to Binance Spot')"
      >
        <span
          class="size-1.5 rounded-full"
          :class="connected ? 'bg-binance-buy' : 'bg-binance-muted'"
        >
        </span>
        {{ connected ? 'Live' : 'Connecting' }}
      </div>
    </dl>
  </div>
  </header>
</template>
