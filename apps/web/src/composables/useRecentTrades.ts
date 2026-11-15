import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Market } from '../constants/chart'
import type { Trade } from '../types/trade'
import { subscribeTrades } from '../services/binance'

const MAX_RECENT_TRADES = 50

/**
 * Subscribes to the selected market's trade stream, keeps at most the 50 most
 * recent entries, and releases the subscription when the market changes or
 * the owner is unmounted.
 *
 * @param market The market as a value, ref, or getter.
 * @returns Reactive trades, connection state, and error message.
 */
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
            error.value = ''
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
