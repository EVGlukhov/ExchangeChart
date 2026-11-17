<script setup lang="ts">
import { computed } from 'vue'
import Typography from '../ui/Typography.vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
)

const buttonClasses = computed(() => {
  const variantClasses =
    props.variant === 'primary'
      ? 'bg-binance-accent text-binance-page font-semibold'
      : 'text-binance-accent hover:underline'
  const sizeClasses = props.size === 'sm' ? '' : 'rounded px-3 py-2'

  return `${variantClasses} ${sizeClasses}`
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
    class="disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Typography :variant="size === 'sm' ? 'caption' : 'body'" tone="inherit">
      <slot />
    </Typography>
  </button>
</template>
