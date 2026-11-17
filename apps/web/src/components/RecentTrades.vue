<script setup lang="ts">
import { useRecentTrades } from '../composables/useRecentTrades'
import { TRADE_SIDE, type Market } from '../constants/chart'
import Typography from './ui/Typography.vue'
import ConnectionStatus from './ui/ConnectionStatus.vue'
import Panel from './layout/Panel.vue'
import { formatTradePrice, formatTradeQuantity, formatTradeTime } from '../utils/formatters'
const props = defineProps<{ market: Market }>()
const { trades, connected, error } = useRecentTrades(() => props.market)
</script>

<template>
  <Panel title="Recent Trades" class="flex h-[min(45vh,360px)] min-h-80 flex-col">
    <template #actions>
      <ConnectionStatus :connected="connected" />
    </template>

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
                {{ formatTradePrice(trade.price) }}
              </Typography>
            </td>
            <td class="truncate px-1 py-1 text-right">
              <Typography variant="caption" numeric mono>
                {{ formatTradeQuantity(trade.quantity) }}
              </Typography>
            </td>
            <td class="truncate px-3 py-1 text-right">
              <Typography variant="caption" tone="muted" mono>
                {{ formatTradeTime(trade.time) }}
              </Typography>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Panel>
</template>
