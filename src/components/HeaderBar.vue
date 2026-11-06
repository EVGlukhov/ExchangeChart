<script setup lang="ts">
  import MarketSelector from './MarketSelector.vue'

  const market = defineModel<string>({ required: true })
</script>

<template>
  <header class="mb-6 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
    <a href="/" class="text-xl font-bold tracking-wide text-amber-400 no-underline">
      EXCHANGE<span class="text-gray-100">CHART</span>
    </a>

    <MarketSelector v-model="market" />
  </header>
</template>
