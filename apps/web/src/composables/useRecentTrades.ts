import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Market } from '../constants/chart'
import type { Trade } from '../types/trade'
import { subscribeTrades } from '../services/binance'

const MAX_RECENT_TRADES = 50

export function useRecentTrades(market: MaybeRefOrGetter<Market>) {
  const trades = ref<Trade[]>([])
  const connected = ref(false)
  const error = ref('')

  watch(
    () => toValue(market),
    (selectedMarket, _, onCleanup) => {
      trades.value = []
      connected.value = false
      error.value = ''

      try {
        const unsubscribe = subscribeTrades(selectedMarket, {
          onTrade(trade) {
            trades.value = [trade, ...trades.value].slice(0, MAX_RECENT_TRADES)
          },
          onOpen() {
            connected.value = true
          },
          onError(cause) {
            connected.value = false
            error.value = cause.message
          },
        })

        onCleanup(() => {
          unsubscribe()
          connected.value = false
        })
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Could not subscribe to trades'
      }
    },
    { immediate: true },
  )

  return { trades, connected, error }
}
