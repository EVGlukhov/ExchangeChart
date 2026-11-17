<script setup lang="ts" generic="T extends string">
import Typography from '../ui/Typography.vue'

const props = defineProps<{
  label: string
  modelValue: T
  options: readonly { label: string; value: T }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

function handleChange(event: Event) {
  const select = event.currentTarget

  if (!(select instanceof HTMLSelectElement)) return

  const selectedOption = props.options.find((option) => option.value === select.value)

  if (selectedOption) {
    emit('update:modelValue', selectedOption.value)
  }
}
</script>

<template>
  <label class="block">
    <Typography variant="small" tone="muted">{{ label }}</Typography>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="border-binance-border bg-binance-panel text-binance-text mt-1 w-full rounded border px-2 py-2 text-xs"
      @change="handleChange"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>
