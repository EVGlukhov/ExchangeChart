<script setup lang="ts">
import { computed } from 'vue'
import { useSpotTicker } from '../composables/useSpotTicker.ts'
import type { Market } from '../constants/chart.ts'
import MarketSelector from './MarketSelector.vue'
import Typography from './ui/Typography.vue'
import ConnectionStatus from './ui/ConnectionStatus.vue'
import { formatHeaderVolume, formatMarketPrice, formatPercentChange } from '../utils/formatters'

const market = defineModel<Market>({ required: true })
const { ticker, connected, error } = useSpotTicker(() => market.value)

const changeTone = computed(() => {
  if (ticker.value === null) return 'muted'
  return ticker.value.changePercent >= 0 ? 'buy' : 'sell'
})
</script>

<template>
  <header class="border-binance-border bg-binance-page text-binance-text border-b">
    <div class="mx-auto grid grid-cols-2 items-center gap-x-4 gap-y-4 py-4 xl:flex xl:gap-5">
      <a href="/" class="order-1 flex items-center gap-3 xl:order-1">
        <Typography
          variant="heading"
          tone="accent"
          class="bg-binance-accent/10 ring-binance-accent/20 grid size-10 place-items-center rounded-xl ring-1 ring-inset"
        >
          EC
        </Typography>
        <span>
          <Typography variant="heading" class="block tracking-wide">
            EXCHANGE<Typography variant="heading" tone="default">CHART</Typography>
          </Typography>
          <Typography variant="overline" tone="muted" class="mt-0.5 block">
            Spot market
          </Typography>
        </span>
      </a>

      <MarketSelector v-model="market" class="order-3 min-w-0 xl:order-2" />

      <div class="order-4 min-w-0 text-right xl:order-3">
        <Typography variant="overline" tone="muted" class="mb-1 block"> Last price </Typography>
        <div class="flex items-center justify-end gap-2">
          <Typography variant="display" :tone="changeTone" numeric>
            {{ formatMarketPrice(ticker?.lastPrice) }}
          </Typography>
          <Typography
            variant="caption"
            :tone="changeTone"
            numeric
            class="border-binance-border bg-binance-surface rounded-full border px-2 py-1 font-semibold"
          >
            {{ ticker ? `${formatPercentChange(ticker.changePercent)}%` : '-' }}
          </Typography>
        </div>
      </div>

      <dl
        class="order-5 col-span-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:order-4 xl:ml-auto xl:flex"
      >
        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt><Typography variant="caption" tone="muted">24h High</Typography></dt>
          <dd class="mt-1">
            <Typography variant="heading" numeric>
              {{ formatMarketPrice(ticker?.highPrice) }}
            </Typography>
          </dd>
        </div>

        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt><Typography variant="caption" tone="muted">24h Low</Typography></dt>
          <dd class="mt-1">
            <Typography variant="heading" numeric>{{
              formatMarketPrice(ticker?.lowPrice)
            }}</Typography>
          </dd>
        </div>

        <div class="border-binance-border bg-binance-surface min-w-0 rounded-xl border px-3 py-2.5">
          <dt><Typography variant="caption" tone="muted">24h Volume (USDT)</Typography></dt>
          <dd class="mt-1">
            <Typography variant="heading" numeric>
              {{ formatHeaderVolume(ticker?.quoteVolume) }}
            </Typography>
          </dd>
        </div>
      </dl>
      <ConnectionStatus
        :connected="connected"
        size="normal"
        :title="error || (connected ? 'Connected to Binance Spot' : 'Connecting to Binance Spot')"
        class="border-binance-border bg-binance-surface order-2 justify-self-end rounded-full border px-3 py-1.5 xl:order-5"
      />
    </div>
  </header>
</template>
