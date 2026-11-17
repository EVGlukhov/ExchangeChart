import type { SpotOrderRequest } from '@exchange-chart/shared'
import { ref } from 'vue'
import { placeTestnetOrder } from '../services/testnet'

export function useTestnetOrder() {
  const submitting = ref(false)
  const error = ref('')
  const success = ref('')

  async function submit(order: SpotOrderRequest): Promise<boolean> {
    if (submitting.value) return false

    submitting.value = true
    error.value = ''
    success.value = ''

    try {
      const orderId = await placeTestnetOrder(order)
      success.value = `Order ${orderId} placed successfully`
      return true
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to place order.'

      error.value = message.includes('PERCENT_PRICE_BY_SIDE')
        ? "The limit price is outside Binance's allowed range for this side. Adjust it closer to the market price."
        : message

      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    error,
    success,
    submit,
  }
}
