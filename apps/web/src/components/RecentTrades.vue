<script setup lang="ts">
import { useRecentTrades } from '../composables/useRecentTrades'
import { TRADE_SIDE, type Market } from '../constants/chart'
import Typography from './ui/Typography.vue'

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
      <Typography as="h2" variant="small" class="font-medium">Recent Trades</Typography>

      <span class="flex items-center gap-1.5">
        <span
          class="size-1.5 rounded-full"
          :class="connected ? 'bg-binance-buy' : 'bg-binance-muted'"
        ></span>
        <Typography variant="caption" tone="muted">
          {{ connected ? 'Live' : 'Connecting' }}
        </Typography>
      </span>
    </header>

    <Typography v-if="error" as="p" variant="small" tone="sell" class="p-3" role="alert">
      Waiting for trades
    </Typography>

    <div v-else class="min-h-0 flex-1 overflow-y-auto">
      <table class="w-full table-fixed">
        <thead class="bg-binance-panel sticky top-0">
          <tr>
            <th class="w-[40%] px-3 py-2">
              <Typography variant="caption" tone="muted" class="font-normal">
                Price (USDT)
              </Typography>
            </th>
            <th class="w-[32%] px-1 py-2 text-right">
              <Typography variant="caption" tone="muted" class="font-normal">Amount</Typography>
            </th>
            <th class="w-[28%] px-3 py-2 text-right">
              <Typography variant="caption" tone="muted" class="font-normal">Time</Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in trades" :key="trade.id" class="hover:bg-binance-hover">
            <td class="truncate px-3 py-1">
              <Typography
                variant="caption"
                :tone="trade.side === TRADE_SIDE.BUY ? 'buy' : 'sell'"
                numeric
                mono
              >
                {{ priceFormatter.format(trade.price) }}
              </Typography>
            </td>
            <td class="truncate px-1 py-1 text-right">
              <Typography variant="caption" numeric mono>
                {{ quantityFormatter.format(trade.quantity) }}
              </Typography>
            </td>
            <td class="truncate px-3 py-1 text-right">
              <Typography variant="caption" tone="muted" mono>
                {{ new Date(trade.time).toLocaleTimeString() }}
              </Typography>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
