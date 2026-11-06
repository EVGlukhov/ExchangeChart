<script setup lang="ts">
defineProps<{
  pressed: boolean
}>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :class="[
      'rounded px-2.5 py-1.5 uppercase text-sm transition-colors',
      pressed
        ? 'bg-gray-700 text-amber-400'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
    ]"
  >
    <slot />
  </button>
</template>
