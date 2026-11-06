<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart.ts'

const market = defineModel<string>({ required: true })
</script>

<template>
  <label
    class="
      flex items-center gap-3 text-sm text-gray-400
    "
  >
    <span>Market</span>
    <select
      v-model="market"
      aria-label="Select market"
      class="
        rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm outline-none transition hover:border-gray-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20
      "

    >
      <option v-for="item in MARKETS" :key="item.symbol" :value="item.symbol">
          {{ item.label }}
      </option>
    </select>
  </label>
</template>
