<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Market } from '../constants/chart'
import {
  isPositiveDecimal,
  ORDER_SIDE,
  ORDER_TYPE,
  TIME_IN_FORCE,
  type SpotBalance,
  type SpotOrderRequest,
  type SpotOrderSide,
  type SpotOrderType,
  type SpotTimeInForce,
} from '@exchange-chart/shared'
import { fetchTestnetBalances, placeTestnetOrder } from '../services/testnet'
import { useSpotTicker } from '../composables/useSpotTicker'

const props = defineProps<{ market: Market }>()

const side = ref<SpotOrderSide>(ORDER_SIDE.BUY)
const type = ref<SpotOrderType>(ORDER_TYPE.LIMIT)
const quantity = ref('')
const price = ref('')
const timeInForce = ref<SpotTimeInForce>(TIME_IN_FORCE.GTC)

const balances = ref<SpotBalance[]>([])
const balancesLoaded = ref(false)
const balancesLoading = ref(false)
const balanceError = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

const { ticker } = useSpotTicker(() => props.market)

const baseAsset = computed(() => props.market.replace(/USDT$/, ''))
const quoteAsset = 'USDT'

const baseBalance = computed(() =>
  balances.value.find((balance) => balance.asset === baseAsset.value),
)
const quoteBalance = computed(() => balances.value.find((balance) => balance.asset === quoteAsset))

const requiredAsset = computed(() => (side.value === ORDER_SIDE.BUY ? quoteAsset : baseAsset.value))

const availableBalance = computed<number | null>(() => {
  if (!balancesLoaded.value) return null

  const balance = side.value === ORDER_SIDE.BUY ? quoteBalance.value : baseBalance.value
  return Number(balance?.free ?? '0')
})

const estimatedRequired = computed<number | null>(() => {
  if (!isPositiveDecimal(quantity.value)) return null

  const quantityValue = Number(quantity.value)
  if (!Number.isFinite(quantityValue)) return null

  if (side.value === ORDER_SIDE.SELL) return quantityValue

  const referencePrice =
    type.value === ORDER_TYPE.LIMIT
      ? isPositiveDecimal(price.value)
        ? Number(price.value)
        : null
      : (ticker.value?.lastPrice ?? null)

  if (referencePrice === null || !Number.isFinite(referencePrice)) return null

  const estimate = quantityValue * referencePrice
  return Number.isFinite(estimate) ? estimate : null
})

const exceedsAvailableBalance = computed(() => {
  const available = availableBalance.value
  const required = estimatedRequired.value

  return available !== null && required !== null && required > available
})

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
})

function formatNumber(value: string | number | undefined): string {
  if (value === undefined) return '--'

  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? numberFormatter.format(number) : String(value)
}

/**
 * Loads the latest balance snapshot without discarding the last successful
 * snapshot if a refresh fails.
 */
async function refreshBalances() {
  balancesLoading.value = true
  balanceError.value = ''

  try {
    balances.value = await fetchTestnetBalances()
    balancesLoaded.value = true
  } catch (cause) {
    balanceError.value = cause instanceof Error ? cause.message : 'Failed to load balances.'
  } finally {
    balancesLoading.value = false
  }
}

/**
 * Validates the form and submits a Market or Limit order to Spot Testnet.
 */
async function submitOrder() {
  if (submitting.value) return

  error.value = ''
  success.value = ''

  if (!isPositiveDecimal(quantity.value)) {
    error.value = 'Enter a valid positive quantity.'
    return
  }

  let order: SpotOrderRequest

  if (type.value === ORDER_TYPE.MARKET) {
    order = {
      symbol: props.market,
      side: side.value,
      type: ORDER_TYPE.MARKET,
      quantity: quantity.value,
    }
  } else {
    if (!isPositiveDecimal(price.value)) {
      error.value = 'Enter a valid positive price.'
      return
    }

    order = {
      symbol: props.market,
      side: side.value,
      type: ORDER_TYPE.LIMIT,
      quantity: quantity.value,
      price: price.value,
      timeInForce: timeInForce.value,
    }
  }

  submitting.value = true

  try {
    const orderId = await placeTestnetOrder(order)
    success.value = `Order ${orderId} placed successfully.`
    quantity.value = ''
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

onMounted(() => {
  void refreshBalances()
})
</script>

<template>
  <section
    class="border-binance-border bg-binance-surface text-binance-text overflow-hidden rounded-lg border shadow-sm shadow-black/30"
  >
    <header class="border-binance-border flex h-11 items-center border-b px-3">
      <h2 class="text-xs font-medium">Place Order</h2>
      <span class="text-binance-muted ml-auto text-[10px]">{{ market }}</span>
    </header>

    <div class="border-binance-border grid gap-3 border-b p-3 sm:grid-cols-2">
      <div class="bg-binance-panel rounded p-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-binance-muted text-xs">Available {{ quoteAsset }}</h3>
          <button
            type="button"
            class="text-binance-accent text-[10px] hover:underline disabled:opacity-50"
            :disabled="balancesLoading"
            @click="refreshBalances"
          >
            {{ balancesLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <p class="mt-1 text-sm font-semibold tabular-nums">
          {{ formatNumber(quoteBalance?.free) }}
        </p>

        <p class="text-binance-muted mt-1 text-[10px]">
          Locked: {{ formatNumber(quoteBalance?.locked) }}
        </p>
      </div>

      <div class="bg-binance-panel rounded p-3">
        <h3 class="text-binance-muted text-xs">Available {{ baseAsset }}</h3>
        <p class="mt-1 text-sm font-semibold tabular-nums">
          {{ formatNumber(baseBalance?.free) }}
        </p>
        <p class="text-binance-muted mt-1 text-[10px]">
          Locked: {{ formatNumber(baseBalance?.locked) }}
        </p>
      </div>
    </div>

    <p v-if="balanceError" class="text-binance-sell px-3 pt-2 text-xs" role="alert">
      Could not refresh balances: {{ balanceError }}
    </p>

    <form
      class="grid items-end gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6"
      @submit.prevent="submitOrder"
    >
      <label class="text-binance-muted block text-xs">
        Side
        <select
          v-model="side"
          class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
        >
          <option :value="ORDER_SIDE.BUY">Buy</option>
          <option :value="ORDER_SIDE.SELL">Sell</option>
        </select>
      </label>

      <label class="text-binance-muted block text-xs">
        Type
        <select
          v-model="type"
          class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
        >
          <option :value="ORDER_TYPE.LIMIT">Limit</option>
          <option :value="ORDER_TYPE.MARKET">Market</option>
        </select>
      </label>

      <label class="text-binance-muted block text-xs">
        Quantity
        <input
          v-model.trim="quantity"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          required
          placeholder="0.001"
          class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
        />
      </label>

      <label v-if="type === ORDER_TYPE.LIMIT" class="text-binance-muted block text-xs">
        Price (USDT)
        <input
          v-model.trim="price"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          required
          placeholder="0.00"
          class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
        />
      </label>

      <label v-if="type === ORDER_TYPE.LIMIT" class="text-binance-muted block text-xs">
        Time in force
        <select
          v-model="timeInForce"
          class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
        >
          <option :value="TIME_IN_FORCE.GTC">GTC</option>
          <option :value="TIME_IN_FORCE.IOC">IOC</option>
          <option :value="TIME_IN_FORCE.FOK">FOK</option>
        </select>
      </label>

      <button
        type="submit"
        :disabled="submitting"
        class="bg-binance-accent text-binance-page rounded px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ submitting ? 'Submitting...' : `Place ${side} order` }}
      </button>
    </form>

    <div class="text-binance-muted px-3 pb-3 text-xs">
      <p v-if="estimatedRequired !== null">
        {{ side === ORDER_SIDE.BUY ? 'Estimated funds required' : 'Amount to sell' }}
        {{ formatNumber(estimatedRequired) }} {{ requiredAsset }}
        <span v-if="side === ORDER_SIDE.BUY"> (before fees)</span>
      </p>
      <p v-if="type === ORDER_TYPE.MARKET && side === ORDER_SIDE.BUY">
        Market-buy estimate uses the latest ticker and may change.
      </p>
      <p v-if="exceedsAvailableBalance" class="text-binance-sell" role="status">
        Estimate exceeds your available {{ requiredAsset }} balance. Binance will confirm
        availability when the order is submitted.
      </p>
    </div>

    <p v-if="error" class="text-binance-sell px-3 pb-3 text-xs" role="alert">
      {{ error }}
    </p>
    <p v-if="success" class="text-binance-buy px-3 pb-3 text-xs" role="alert">
      {{ success }}
    </p>
  </section>
</template>
