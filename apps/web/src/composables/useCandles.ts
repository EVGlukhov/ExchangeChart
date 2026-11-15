import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Market, Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle'
import { fetchCandles, subscribeCandles } from '../services/binance'

/**
 * Loads candles for the current market and timeframe, then keeps them up to date
 * over WebSocket. Aborts the previous request and subscription when either
 * parameter changes.
 *
 * @param market The market as a value, ref, or getter.
 * @param timeframe The timeframe as a value, ref, or getter.
 * @returns Reactive candles, loading state, and error message.
 */
export function useCandles(
  market: MaybeRefOrGetter<Market>,
  timeframe: MaybeRefOrGetter<Timeframe>,
) {
  const candles = ref<Candle[]>([])
  const loading = ref(false)
  const error = ref('')

  watch(
    () => [toValue(market), toValue(timeframe)] as const,
    async ([selectedMarket, selectedTimeframe], _, onCleanup) => {
      const controller = new AbortController()
      let unsubscribe: (() => void) | undefined

      onCleanup(() => {
        controller?.abort()
        unsubscribe?.()
      })

      loading.value = true
      error.value = ''

      try {
        candles.value = await fetchCandles(selectedMarket, selectedTimeframe, controller.signal)
        unsubscribe = subscribeCandles(
          selectedMarket,
          selectedTimeframe,
          (incomingCandle) => {
            const updatedCandles = [...candles.value]
            const existingIndex = updatedCandles.findIndex(
              (candle) => candle.time === incomingCandle.time,
            )

            if (existingIndex >= 0) {
              updatedCandles[existingIndex] = incomingCandle
            } else {
              updatedCandles.push(incomingCandle)
            }

            candles.value = updatedCandles
          },
          (cause) => {
            error.value = cause.message
          },
          () => {
            error.value = ''
          },
        )
      } catch (cause) {
        if (controller.signal.aborted) return

        error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить свечи'
        candles.value = []
      } finally {
        if (!controller.signal.aborted) {
          loading.value = false
        }
      }
    },
    { immediate: true },
  )

  return { candles, loading, error }
}
