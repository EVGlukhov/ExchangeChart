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
import { placeTestnetOrder } from '../services/testnet'
import { useSpotTicker } from '../composables/useSpotTicker'
import Typography from './ui/Typography.vue'
import Panel from './layout/Panel.vue'
import OrderForm from './OrderForm.vue'
import { formatOrderNumber } from '../utils/formatters'
import { useOrderBalances } from '../composables/useOrderBalances.ts'

type OrderFormValues = {
  side: SpotOrderSide
  type: SpotOrderType
  quantity: string
  price: string
  timeInForce: SpotTimeInForce
}

const props = defineProps<{ market: Market }>()

const balanceSide = ref<SpotOrderSide>(ORDER_SIDE.BUY)
const submitting = ref(false)
const error = ref('')
const success = ref('')
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

  error.value = ''
  success.value = ''
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

  submitting.value = true

  try {
    const orderId = await placeTestnetOrder(order)
    success.value = `Order ${orderId} placed successfully.`
    resetKey.value += 1
    await refreshBalances()
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Failed to place order.'
    error.value = message.includes('PERCENT_PRICE_BY_SIDE')
      ? "The limit price is outside Binance's allowed range for this side. Adjust it closer to the market price."
      : message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Panel title="Place Order">
    <template #actions>
      <Typography variant="caption" tone="muted" class="ml-auto">{{ market }}</Typography>
    </template>

    <div class="border-binance-border grid gap-3 border-b p-3 sm:grid-cols-2">
      <div class="bg-binance-panel rounded p-3">
        <div class="flex items-center justify-between gap-2">
          <Typography as="h3" variant="small" tone="muted"> Available {{ quoteAsset }} </Typography>
          <button
            type="button"
            class="text-binance-accent hover:underline disabled:opacity-50"
            :disabled="balancesLoading"
            @click="refreshBalances"
          >
            <Typography variant="caption" tone="inherit">
              {{ balancesLoading ? 'Refreshing...' : 'Refresh' }}
            </Typography>
          </button>
        </div>

        <Typography as="p" variant="heading" numeric class="mt-1">
          {{ formatOrderNumber(quoteBalance?.free) }}
        </Typography>

        <Typography as="p" variant="caption" tone="muted" class="mt-1">
          Locked: {{ formatOrderNumber(quoteBalance?.locked) }}
        </Typography>
      </div>

      <div class="bg-binance-panel rounded p-3">
        <Typography as="h3" variant="small" tone="muted"> Available {{ baseAsset }} </Typography>
        <Typography as="p" variant="heading" numeric class="mt-1">
          {{ formatOrderNumber(baseBalance?.free) }}
        </Typography>
        <Typography as="p" variant="caption" tone="muted" class="mt-1">
          Locked: {{ formatOrderNumber(baseBalance?.locked) }}
        </Typography>
      </div>
    </div>

    <Typography
      v-if="balanceError"
      as="p"
      variant="small"
      tone="sell"
      class="px-3 pt-2"
      role="alert"
    >
      Could not refresh balances: {{ balanceError }}
    </Typography>

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
