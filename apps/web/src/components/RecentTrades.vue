<script setup lang="ts">
import { useRecentTrades } from '../composables/useRecentTrades'
import { TRADE_SIDE, type Market } from '../constants/chart'

const props = defineProps<{ market: Market }>()
const { trades, connected, error } = useRecentTrades(() => props.market)

const priceFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
})
const quantityFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 6,
})
</script>

<template>
  <section
    class="border-binance-border bg-binance-surface text-binance-text flex h-[min(65vh,560px)] min-h-80 flex-col overflow-hidden rounded-lg border shadow-sm shadow-black/30"
  >
    <header
      class="border-binance-border flex h-11 shrink-0 items-center justify-between border-b px-3"
    >
      <h2 class="text-xs font-medium">Recent Trades</h2>

      <span class="text-binance-muted flex items-center gap-1.5 text-[10px]">
        <span
          class="size-1.5 rounded-full"
          :class="connected ? 'bg-binance-buy' : 'bg-binance-muted'"
        ></span>
        {{ connected ? 'Live' : 'Connecting' }}
      </span>
    </header>

    <p v-if="error" class="text-binance-sell p-3 text-xs" role="alert">Waiting for trades</p>

    <div v-else class="min-h-0 flex-1 overflow-y-auto">
      <table class="w-full table-fixed text-[10px] tabular-nums">
        <thead class="bg-binance-panel text-binance-muted sticky top-0">
          <tr>
            <th class="w-[40%] px-3 py-2 font-normal">Price (USDT)</th>
            <th class="w-[32%] px-1 py-2 text-right font-normal">Amount</th>
            <th class="w-[28%] px-3 py-2 text-right font-normal">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in trades" :key="trade.id" class="hover:bg-binance-hover font-mono">
            <td
              class="truncate px-3 py-1"
              :class="trade.side === TRADE_SIDE.BUY ? 'text-binance-buy' : 'text-binance-sell'"
            >
              {{ priceFormatter.format(trade.price) }}
            </td>
            <td class="text-binance-text truncate px-1 py-1 text-right">
              {{ quantityFormatter.format(trade.quantity) }}
            </td>
            <td class="text-binance-muted truncate px-3 py-1 text-right">
              {{ new Date(trade.time).toLocaleTimeString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
