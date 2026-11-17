import { computed, onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { Market } from '../constants/chart'
import { ORDER_SIDE, type SpotBalance, type SpotOrderSide } from '@exchange-chart/shared'
import { fetchTestnetBalances } from '../services/testnet'

export function useOrderBalances(
  market: MaybeRefOrGetter<Market>,
  side: MaybeRefOrGetter<SpotOrderSide>,
) {
  const balances = ref<SpotBalance[]>([])
  const balancesLoaded = ref(false)
  const balancesLoading = ref(false)
  const balanceError = ref('')
  const baseAsset = computed(() => toValue(market).replace(/USDT$/, ''))
  const quoteAsset = 'USDT'

  const baseBalance = computed(() =>
    balances.value.find((balance) => balance.asset === baseAsset.value),
  )
  const quoteBalance = computed(() =>
    balances.value.find((balance) => balance.asset === quoteAsset),
  )

  const requiredAsset = computed(() =>
    toValue(side) === ORDER_SIDE.BUY ? quoteAsset : baseAsset.value,
  )

  const availableBalance = computed<number | null>(() => {
    if (!balancesLoaded.value) return null

    const balance = toValue(side) === ORDER_SIDE.BUY ? quoteBalance.value : baseBalance.value
    return Number(balance?.free ?? '0')
  })

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

  onMounted(() => {
    void refreshBalances()
  })

  return {
    balances,
    balancesLoaded,
    balancesLoading,
    balanceError,
    baseAsset,
    quoteAsset,
    baseBalance,
    quoteBalance,
    requiredAsset,
    availableBalance,
    refreshBalances,
  }
}
