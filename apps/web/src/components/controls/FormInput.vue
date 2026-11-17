<script setup lang="ts">
import Typography from '../ui/Typography.vue'

type InputMode = 'decimal' | 'email' | 'none' | 'numeric' | 'search' | 'tel' | 'text' | 'url'
type InputType = 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    type?: InputType
    inputmode?: InputMode
    autocomplete?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    modelModifiers?: { trim?: boolean }
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return

  const value = props.modelModifiers?.trim ? event.target.value.trim() : event.target.value

  emit('update:modelValue', value)
}
</script>

<template>
  <label class="block">
    <Typography variant="small" tone="muted">{{ label }}</Typography>
    <input
      :value="modelValue"
      :type="type"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2 text-xs"
      @input="handleInput"
    />
  </label>
</template>
