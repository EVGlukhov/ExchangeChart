<script setup lang="ts">
import type { SpotBalance } from '@exchange-chart/shared'
import { formatOrderNumber } from '../utils/formatters'
import Typography from './ui/Typography.vue'

defineProps<{
  balancesLoading: boolean
  balanceError: string
  baseAsset: string
  quoteAsset: string
  baseBalance?: SpotBalance
  quoteBalance?: SpotBalance
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="border-binance-border grid gap-3 border-b p-3 sm:grid-cols-2">
    <div class="bg-binance-panel rounded p-3">
      <div class="flex items-center justify-between gap-2">
        <Typography as="h3" variant="small" tone="muted"> Available {{ quoteAsset }} </Typography>
        <button
          type="button"
          class="text-binance-accent hover:underline disabled:opacity-50"
          :disabled="balancesLoading"
          @click="emit('refresh')"
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

  <Typography v-if="balanceError" as="p" variant="small" tone="sell" class="px-3 pt-2" role="alert">
    Could not refresh balances: {{ balanceError }}
  </Typography>
</template>
