<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  isPositiveDecimal,
  ORDER_SIDE,
  ORDER_TYPE,
  TIME_IN_FORCE,
  type SpotOrderSide,
  type SpotOrderType,
  type SpotTimeInForce,
} from '@exchange-chart/shared'
import FormInput from './controls/FormInput.vue'
import FormButton from './controls/FormButton.vue'
import FormSelect from './controls/FormSelect.vue'
import Typography from './ui/Typography.vue'

type OrderFormValues = {
  side: SpotOrderSide
  type: SpotOrderType
  quantity: string
  price: string
  timeInForce: SpotTimeInForce
}

const props = defineProps<{
  submitting: boolean
  resetKey: number
}>()

const emit = defineEmits<{
  submit: [values: OrderFormValues]
}>()

const side = ref<SpotOrderSide>(ORDER_SIDE.BUY)
const type = ref<SpotOrderType>(ORDER_TYPE.LIMIT)
const quantity = ref('')
const price = ref('')
const timeInForce = ref<SpotTimeInForce>(TIME_IN_FORCE.GTC)
const validationError = ref('')

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

watch(
  () => props.resetKey,
  () => {
    quantity.value = ''
    validationError.value = ''
  },
)

function handleSubmit() {
  validationError.value = ''

  if (!isPositiveDecimal(quantity.value)) {
    validationError.value = 'Enter a valid positive quantity.'
    return
  }

  if (type.value === ORDER_TYPE.LIMIT && !isPositiveDecimal(price.value)) {
    validationError.value = 'Enter a valid positive price.'
    return
  }

  emit('submit', {
    side: side.value,
    type: type.value,
    quantity: quantity.value,
    price: price.value,
    timeInForce: timeInForce.value,
  })
}
</script>

<template>
  <form
    class="grid items-end gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6"
    @submit.prevent="handleSubmit"
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

    <Typography
      v-if="validationError"
      as="p"
      variant="small"
      tone="sell"
      class="sm:col-span-2 lg:col-span-6"
      role="alert"
    >
      {{ validationError }}
    </Typography>
  </form>
</template>
