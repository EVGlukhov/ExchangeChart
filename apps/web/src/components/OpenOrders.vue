<script setup lang="ts">
import { ORDER_SIDE, type SpotOpenOrder } from '@exchange-chart/shared'
import { useTestnetOpenOrders } from '../composables/useTestnetOpenOrders'
import type { Market } from '../constants/chart'
import Typography from './ui/Typography.vue'
import ConnectionStatus from './ui/ConnectionStatus.vue'
import Panel from './layout/Panel.vue'
import { formatOrderNumber } from '../utils/formatters'

const props = defineProps<{ market: Market }>()

const { orders, loading, connected, error, cancellingOrderIds, cancelOrder } = useTestnetOpenOrders(
  () => props.market,
)

function isCancelling(order: SpotOpenOrder): boolean {
  return cancellingOrderIds.value.has(order.orderId)
}
</script>

<template>
  <Panel title="Open Orders">
    <template #actions>
      <ConnectionStatus :connected="connected" />
    </template>

    <Typography v-if="error" as="p" variant="small" tone="sell" class="p-3" role="alert">
      {{ error }}
    </Typography>

    <Typography
      v-if="orders.length === 0"
      as="p"
      variant="small"
      tone="muted"
      class="p-4 text-center"
      role="status"
    >
      {{ loading ? 'Loading open orders...' : 'No open orders' }}
    </Typography>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-2xl table-fixed">
        <thead class="bg-binance-panel">
          <tr>
            <th class="w-[14%] px-3 py-2 text-left">
              <Typography variant="small" tone="muted" class="font-normal">Side</Typography>
            </th>
            <th class="w-[14%] px-2 py-2 text-left">
              <Typography variant="small" tone="muted" class="font-normal">Type</Typography>
            </th>
            <th class="w-[18%] px-2 py-2 text-right">
              <Typography variant="small" tone="muted" class="font-normal">
                Price (USDT)
              </Typography>
            </th>
            <th class="w-[18%] px-2 py-2 text-right">
              <Typography variant="small" tone="muted" class="font-normal">Amount</Typography>
            </th>
            <th class="w-[18%] px-2 py-2 text-right">
              <Typography variant="small" tone="muted" class="font-normal">Filled</Typography>
            </th>
            <th class="w-[10%] px-2 py-2 text-left">
              <Typography variant="small" tone="muted" class="font-normal">Status</Typography>
            </th>
            <th class="w-[8%] px-3 py-2 text-right">
              <Typography variant="small" tone="muted" class="font-normal">Action</Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.orderId" class="border-binance-border border-t">
            <td class="px-3 py-2">
              <Typography
                variant="small"
                :tone="order.side === ORDER_SIDE.BUY ? 'buy' : 'sell'"
                numeric
                mono
              >
                {{ order.side }}
              </Typography>
            </td>
            <td class="truncate px-2 py-2">
              <Typography variant="small" tone="muted" mono>{{ order.type }}</Typography>
            </td>
            <td class="px-2 py-2 text-right">
              <Typography variant="small" numeric mono>{{
                formatOrderNumber(order.price)
              }}</Typography>
            </td>
            <td class="px-2 py-2 text-right">
              <Typography variant="small" numeric mono>{{
                formatOrderNumber(order.origQty)
              }}</Typography>
            </td>
            <td class="px-2 py-2 text-right">
              <Typography variant="small" numeric mono>
                {{ formatOrderNumber(order.executedQty) }}
              </Typography>
            </td>
            <td class="truncate px-2 py-2">
              <Typography variant="small" tone="muted" mono>{{ order.status }}</Typography>
            </td>
            <td class="px-3 py-2 text-right">
              <button
                type="button"
                class="text-binance-sell hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isCancelling(order)"
                :aria-label="`Cancel order ${order.orderId}`"
                @click="cancelOrder(order.orderId)"
              >
                <Typography variant="small" tone="inherit">
                  {{ isCancelling(order) ? '-' : 'Cancel' }}
                </Typography>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Panel>
</template>
