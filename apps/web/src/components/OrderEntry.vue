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
import FormInput from './controls/FormInput.vue'
import FormButton from './controls/FormButton.vue'
import FormSelect from './controls/FormSelect.vue'
import Typography from './ui/Typography.vue'
import Panel from './layout/Panel.vue'

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

const sideOptions: { label: string; value: SpotOrderSide }[] = [
  { label: 'Buy', value: ORDER_SIDE.BUY },
  { label: 'Sell', value: ORDER_SIDE.SELL },
]

const orderTypeOptions: { label: string; value: SpotOrderType }[] = [
  { label: 'Limit', value: ORDER_TYPE.LIMIT },
  { label: 'Market', value: ORDER_TYPE.MARKET },
]

const timeInForceOptions: { label: string; value: SpotTimeInForce }[] = [
  { label: 'GTC', value: TIME_IN_FORCE.GTC },
  { label: 'IOC', value: TIME_IN_FORCE.IOC },
  { label: 'FOK', value: TIME_IN_FORCE.FOK },
]

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
          {{ formatNumber(quoteBalance?.free) }}
        </Typography>

        <Typography as="p" variant="caption" tone="muted" class="mt-1">
          Locked: {{ formatNumber(quoteBalance?.locked) }}
        </Typography>
      </div>

      <div class="bg-binance-panel rounded p-3">
        <Typography as="h3" variant="small" tone="muted"> Available {{ baseAsset }} </Typography>
        <Typography as="p" variant="heading" numeric class="mt-1">
          {{ formatNumber(baseBalance?.free) }}
        </Typography>
        <Typography as="p" variant="caption" tone="muted" class="mt-1">
          Locked: {{ formatNumber(baseBalance?.locked) }}
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

    <form
      class="grid items-end gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6"
      @submit.prevent="submitOrder"
    >
      <FormSelect v-model="side" label="Side" :options="sideOptions" />

      <FormSelect v-model="type" label="Type" :options="orderTypeOptions" />

      <FormInput
        v-model.trim="quantity"
        label="Quantity"
        inputmode="decimal"
        autocomplete="off"
        required
        placeholder="0.001"
      />

      <FormInput
        v-if="type === ORDER_TYPE.LIMIT"
        v-model.trim="price"
        label="Price (USDT)"
        inputmode="decimal"
        autocomplete="off"
        required
        placeholder="0.00"
      />

      <FormSelect
        v-if="type === ORDER_TYPE.LIMIT"
        v-model="timeInForce"
        label="Time in force"
        :options="timeInForceOptions"
      />

      <FormButton type="submit" :disabled="submitting">
        {{ submitting ? 'Submitting...' : `Place ${side} order` }}
      </FormButton>
    </form>

    <div class="px-3 pb-3">
      <Typography v-if="estimatedRequired !== null" as="p" variant="small" tone="muted">
        {{ side === ORDER_SIDE.BUY ? 'Estimated funds required' : 'Amount to sell' }}
        {{ formatNumber(estimatedRequired) }} {{ requiredAsset }}
        <span v-if="side === ORDER_SIDE.BUY"> (before fees)</span>
      </Typography>
      <Typography
        v-if="type === ORDER_TYPE.MARKET && side === ORDER_SIDE.BUY"
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
