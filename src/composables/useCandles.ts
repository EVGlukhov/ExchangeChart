import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Market, Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle'
import { fetchCandles } from '../services/binance'

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

      onCleanup(() => controller?.abort())

      loading.value = true
      error.value = ''

      try {
        candles.value = await fetchCandles(selectedMarket, selectedTimeframe, controller.signal)
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
