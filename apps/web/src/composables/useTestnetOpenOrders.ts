import type { SpotOpenOrder } from '@exchange-chart/shared'
import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  cancelTestnetOrder,
  fetchTestnetOpenOrders,
  subscribeTestnetUserDataStream,
} from '../services/testnet'

/**
 * Loads and tracks open Testnet orders for the selected market.
 *
 * @param market The market as a value, ref, or getter.
 * @returns Reactive orders, loading and connection states, errors, and a cancellation function.
 */
export function useTestnetOpenOrders(market: MaybeRefOrGetter) {
  const orders = ref<SpotOpenOrder[]>([])
  const loading = ref(false)
  const connected = ref(false)
  const error = ref('')
  const cancellingOrderIds = ref(new Set<number>())

  let refreshCurrent: (() => Promise<void>) | undefined

  watch(
    () => toValue(market),
    (symbol, _, onCleanup) => {
      let active = true
      let requestController: AbortController | undefined
      let unsubscribe: (() => void) | undefined

      orders.value = []
      connected.value = false
      error.value = ''

      const refresh = async () => {
        if (!active) return

        requestController?.abort()
        const controller = new AbortController()
        requestController = controller
        loading.value = true
        error.value = ''

        try {
          const snapshot = await fetchTestnetOpenOrders(symbol, controller.signal)

          if (active && !controller.signal.aborted) {
            orders.value = snapshot
          }
        } catch (cause) {
          if (active && !controller.signal.aborted) {
            error.value = cause instanceof Error ? cause.message : 'Failed to load open orders'
          }
        } finally {
          if (requestController === controller) {
            requestController = undefined
            loading.value = false
          }
        }
      }

      refreshCurrent = refresh
      void refresh()

      try {
        unsubscribe = subscribeTestnetUserDataStream({
          onMessage(message) {
            if (!active) return

            if (message.type === 'connection') {
              connected.value = message.connected
              if (message.connected) void refresh()
              return
            }

            if (message.event.e === 'executionReport' && message.event.s === symbol) {
              void refresh()
            }
          },
          onOpen() {
            void refresh()
          },
          onError(cause) {
            if (active) error.value = cause.message
          },
        })
      } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Failed to connect to order updates'
      }

      onCleanup(() => {
        active = false
        requestController?.abort()
        unsubscribe?.()
        connected.value = false

        if (refreshCurrent === refresh) {
          refreshCurrent = undefined
        }
      })
    },
    { immediate: true },
  )

  /**
   * Cancels an order and refreshes the current market's open-order snapshot.
   *
   * @param orderId The Binance order ID to cancel.
   */
  async function cancelOrder(orderId: number) {
    const symbol = toValue(market)
    cancellingOrderIds.value.add(orderId)
    error.value = ''

    try {
      await cancelTestnetOrder(symbol, orderId)
      await refreshCurrent?.()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Failed to cancel order'
    } finally {
      cancellingOrderIds.value.delete(orderId)
    }
  }

  return { orders, loading, connected, error, cancellingOrderIds, cancelOrder }
}
