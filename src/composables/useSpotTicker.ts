import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Market } from '../constants/chart'
import type { SpotTicker } from '../types/spotTicker'
import { subscribeSpotTicker } from '../services/binance'

export function useSpotTicker(market: MaybeRefOrGetter<Market>) {
  const ticker = ref<SpotTicker | null>(null)
  const connected = ref(false)
  const error = ref('')

  watch(
    () => toValue(market),
    (selectedMarket, _, onCleanup) => {
      ticker.value = null
      connected.value = false
      error.value = ''

      try {
        const unsubscribe = subscribeSpotTicker(selectedMarket, {
          onTicker(value) {
            ticker.value = value
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
        error.value = cause instanceof Error ? cause.message : 'Could not subscribe to Spot ticker'
      }
    },
    { immediate: true },
  )

  return { ticker, connected, error }
}
