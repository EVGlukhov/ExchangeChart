<script setup lang="ts">
import { computed } from 'vue'
import { useSpotTicker } from '../composables/useSpotTicker.ts'
import type { Market } from '../constants/chart.ts'
import MarketSelector from './MarketSelector.vue'

const market = defineModel<Market>({ required: true })
const { ticker, connected, error } = useSpotTicker(() => market.value)

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumSignificantDigits: 8,
})

const volumeFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const formatPrice = (value: number | undefined) =>
  value === undefined ? '-' : priceFormatter.format(value)

const formatChange = (value: number | undefined) =>
  value === undefined ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`

const formatVolume = (value: number | undefined) =>
  value === undefined ? '-' : volumeFormatter.format(value)

const changeColor = computed(() => {
  if (ticker.value === null) return 'text-binance-muted'
  return ticker.value.changePercent >= 0 ? 'text-binance-buy' : 'text-binance-sell'
})
</script>

<template>
  <header class="border-binance-border bg-binance-page text-binance-text border-b">
    <div class="mx-auto grid grid-cols-2 items-center gap-x-4 gap-y-4 py-4 xl:flex xl:gap-5">
      <a href="/" class="order-1 flex items-center gap-3 xl:order-1">
        <span
          class="bg-binance-accent/10 text-binance-accent ring-binance-accent/20 grid size-10 place-items-center rounded-xl text-sm font-bold ring-1 ring-inset"
        >
          EC
        </span>
        <span>
          <span class="block text-sm font-bold tracking-wide"
            >EXCHANGE<span class="text-binance-text">CHART</span></span
          >
          <span class="text-binance-muted mt-0.5 block text-[10px] tracking-[0.18em] uppercase"
            >Spot market</span
          >
        </span>
      </a>

      <MarketSelector v-model="market" class="order-3 min-w-0 xl:order-2" />

      <div class="order-4 min-w-0 text-right xl:order-3">
        <span class="text-binance-muted mb-1 block text-[10px] tracking-wider uppercase">
          Last price
        </span>
        <div class="flex items-center justify-end gap-2">
          <strong class="text-lg tabular-nums sm:text-xl" :class="changeColor">
            {{ formatPrice(ticker?.lastPrice) }}
          </strong>
          <span
            class="border-binance-border bg-binance-surface rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums"
            :class="changeColor"
          >
            {{ ticker ? `${formatChange(ticker.changePercent)}%` : '-' }}
          </span>
        </div>
      </div>

      <dl
        class="order-5 col-span-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:order-4 xl:ml-auto xl:flex"
      >
        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt class="text-binance-muted text-[10px]">24h High</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">
            {{ formatPrice(ticker?.highPrice) }}
          </dd>
        </div>

        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt class="text-binance-muted text-[10px]">24h Low</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">
            {{ formatPrice(ticker?.lowPrice) }}
          </dd>
        </div>

        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt class="text-binance-muted text-[10px]">24h Volume (USDT)</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">
            {{ formatVolume(ticker?.quoteVolume) }}
          </dd>
        </div>
      </dl>
      <div
        class="text-binance-muted border-binance-border bg-binance-surface order-2 flex items-center gap-2 justify-self-end rounded-full border px-3 py-1.5 text-xs xl:order-5"
        :title="error || (connected ? 'Connected to Binance Spot' : 'Connecting to Binance Spot')"
      >
        <span
          class="size-2 rounded-full"
          :class="connected ? 'bg-binance-buy animate-pulse' : 'bg-binance-muted'"
        ></span>
        {{ connected ? 'Live' : 'Connecting' }}
      </div>
    </div>
  </header>
</template>
