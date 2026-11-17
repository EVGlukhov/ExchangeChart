<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Market } from '../constants/chart'
import {
  ORDER_SIDE,
  ORDER_TYPE,
  type SpotOrderRequest,
  type SpotOrderSide,
  type SpotOrderType,
  type SpotTimeInForce,
} from '@exchange-chart/shared'
import { useTestnetOrder } from '../composables/useTestnetOrder'
import { useSpotTicker } from '../composables/useSpotTicker'
import Typography from './ui/Typography.vue'
import Panel from './layout/Panel.vue'
import OrderForm from './OrderForm.vue'
import { formatOrderNumber } from '../utils/formatters'
import { useOrderBalances } from '../composables/useOrderBalances.ts'
import OrderBalances from './OrderBalances.vue'

type OrderFormValues = {
  side: SpotOrderSide
  type: SpotOrderType
  quantity: string
  price: string
  timeInForce: SpotTimeInForce
}

const props = defineProps<{ market: Market }>()

const balanceSide = ref<SpotOrderSide>(ORDER_SIDE.BUY)
const resetKey = ref(0)
const lastSubmittedOrder = ref<OrderFormValues | null>(null)
const estimatedRequired = ref<number | null>(null)

const {
  balancesLoading,
  balanceError,
  baseAsset,
  quoteAsset,
  baseBalance,
  quoteBalance,
  requiredAsset,
  availableBalance,
  refreshBalances,
} = useOrderBalances(() => props.market, balanceSide)

const { submitting, error, success, submit: submitTestnetOrder } = useTestnetOrder()

const { ticker } = useSpotTicker(() => props.market)

const exceedsAvailableBalance = computed(() => {
  const available = availableBalance.value
  const required = estimatedRequired.value

  return available !== null && required !== null && required > available
})

function calculateEstimatedRequired(values: OrderFormValues): number | null {
  const quantityValue = Number(values.quantity)
  if (!Number.isFinite(quantityValue)) return null

  if (values.side === ORDER_SIDE.SELL) return quantityValue

  const referencePrice =
    values.type === ORDER_TYPE.LIMIT ? Number(values.price) : (ticker.value?.lastPrice ?? null)

  if (referencePrice === null || !Number.isFinite(referencePrice)) return null

  const estimate = quantityValue * referencePrice
  return Number.isFinite(estimate) ? estimate : null
}

async function submitOrder(values: OrderFormValues) {
  if (submitting.value) return

  balanceSide.value = values.side
  lastSubmittedOrder.value = values
  estimatedRequired.value = calculateEstimatedRequired(values)

  let order: SpotOrderRequest

  if (values.type === ORDER_TYPE.MARKET) {
    order = {
      symbol: props.market,
      side: values.side,
      type: ORDER_TYPE.MARKET,
      quantity: values.quantity,
    }
  } else {
    order = {
      symbol: props.market,
      side: values.side,
      type: ORDER_TYPE.LIMIT,
      quantity: values.quantity,
      price: values.price,
      timeInForce: values.timeInForce,
    }
  }

  const placed = await submitTestnetOrder(order)
  if (!placed) return

  resetKey.value += 1
  await refreshBalances()
}
</script>

<template>
  <Panel title="Place Order">
    <template #actions>
      <Typography variant="caption" tone="muted" class="ml-auto">{{ market }}</Typography>
    </template>

    <OrderBalances
      :balances-loading="balancesLoading"
      :balance-error="balanceError"
      :base-asset="baseAsset"
      :quote-asset="quoteAsset"
      :base-balance="baseBalance"
      :quote-balance="quoteBalance"
      @refresh="refreshBalances"
    />

    <OrderForm :submitting="submitting" :reset-key="resetKey" @submit="submitOrder" />

    <div class="px-3 pb-3">
      <Typography v-if="estimatedRequired !== null" as="p" variant="small" tone="muted">
        {{
          lastSubmittedOrder?.side === ORDER_SIDE.BUY
            ? 'Estimated funds required'
            : 'Amount to sell'
        }}
        {{ formatOrderNumber(estimatedRequired) }} {{ requiredAsset }}
        <span v-if="lastSubmittedOrder?.side === ORDER_SIDE.BUY"> (before fees)</span>
      </Typography>

      <Typography
        v-if="
          lastSubmittedOrder?.type === ORDER_TYPE.MARKET &&
          lastSubmittedOrder?.side === ORDER_SIDE.BUY
        "
        as="p"
        variant="small"
        tone="muted"
      >
        Market-buy estimate uses the latest ticker and may change.
      </Typography>

      <Typography v-if="exceedsAvailableBalance" as="p" variant="small" tone="sell" role="status">
        Estimate exceeds your available {{ requiredAsset }} balance. Binance will confirm
        availability when the order is submitted.
      </Typography>
    </div>

    <Typography v-if="error" as="p" variant="small" tone="sell" class="px-3 pb-3" role="alert">
      {{ error }}
    </Typography>

    <Typography v-if="success" as="p" variant="small" tone="buy" class="px-3 pb-3" role="alert">
      {{ success }}
    </Typography>
  </Panel>
</template>
