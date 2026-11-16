<script setup lang="ts">
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
  <label class="text-binance-muted block text-xs">
    {{ label }}
    <input
      :value="modelValue"
      :type="type"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2"
      @input="handleInput"
    />
  </label>
</template>
