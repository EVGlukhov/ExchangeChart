<script setup lang="ts">
import { ORDER_SIDE, type SpotOpenOrder } from '@exchange-chart/shared'
import { useTestnetOpenOrders } from '../composables/useTestnetOpenOrders'
import type { Market } from '../constants/chart'

const props = defineProps<{ market: Market }>()

const { orders, loading, connected, error, cancellingOrderIds, cancelOrder } = useTestnetOpenOrders(
  () => props.market,
)

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
})

function formatNumber(value: string): string {
  const number = Number(value)
  return Number.isFinite(number) ? numberFormatter.format(number) : value
}

function isCancelling(order: SpotOpenOrder): boolean {
  return cancellingOrderIds.value.has(order.orderId)
}
</script>

<template>
  <section
    class="border-binance-border bg-binance-surface text-binance-text overflow-hidden rounded-lg border shadow-sm shadow-black/30"
  >
    <header class="border-binance-border flex h-11 items-center justify-between border-b px-3">
      <h2 class="text-xs font-medium">Open Orders</h2>

      <span class="text-binance-muted flex items-center gap-1.5 text-[10px]">
        <span
          class="size-1.5 rounded-full"
          :class="connected ? 'bg-binance-buy' : 'bg-binance-muted'"
        >
        </span>
        {{ connected ? 'Live' : 'Connecting' }}
      </span>
    </header>

    <p v-if="error" class="text-binance-sell p-3 text-xs" role="alert">
      {{ error }}
    </p>

    <p v-if="orders.length === 0" class="text-binance-muted p-4 text-center text-xs" role="status">
      {{ loading ? 'Loading open orders...' : 'No open orders' }}
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-2xl table-fixed text-xs tabular-nums">
        <thead class="bg-binance-panel text-binance-muted">
          <tr>
            <th class="w-[14%] px-3 py-2 text-left font-normal">Side</th>
            <th class="w-[14%] px-2 py-2 text-left font-normal">Type</th>
            <th class="w-[18%] px-2 py-2 text-right font-normal">Price (USDT)</th>
            <th class="w-[18%] px-2 py-2 text-right font-normal">Amount</th>
            <th class="w-[18%] px-2 py-2 text-right font-normal">Filled</th>
            <th class="w-[10%] px-2 py-2 text-left font-normal">Status</th>
            <th class="w-[8%] px-3 py-2 text-right font-normal">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.orderId"
            class="border-binance-border border-t font-mono"
          >
            <td
              class="px-3 py-2"
              :class="order.side === ORDER_SIDE.BUY ? 'text-binance-buy' : 'text-binance-sell'"
            >
              {{ order.side }}
            </td>
            <td class="text-binance-muted truncate px-2 py-2">{{ order.type }}</td>
            <td class="px-2 py-2 text-right">{{ formatNumber(order.price) }}</td>
            <td class="px-2 py-2 text-right">{{ formatNumber(order.origQty) }}</td>
            <td class="px-2 py-2 text-right">{{ formatNumber(order.executedQty) }}</td>
            <td class="text-binance-muted truncate px-2 py-2">{{ order.status }}</td>
            <td class="px-3 py-2 text-right">
              <button
                type="button"
                class="text-binance-sell hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isCancelling(order)"
                :aria-label="`Cancel order ${order.orderId}`"
                @click="cancelOrder(order.orderId)"
              >
                {{ isCancelling(order) ? '-' : 'Cancel' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
