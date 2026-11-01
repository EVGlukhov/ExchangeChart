<script setup lang="ts">
import { MARKETS, type Market } from '../constants/chart.ts'

const market = defineModel<string>({ required: true })
</script>

<template>
  <label
    class="
      flex
      text-sm text-gray-400
      items-center gap-3
    "
  >
    <span>Market</span>
    <select
      v-model="market"
      aria-label="Select market"
      class="
        px-3 py-2
        text-gray-100
        bg-gray-900
        rounded-md border border-gray-700
        outline-none focus:border-amber-400
      "

    >
      <option v-for="item in MARKETS" :key="item.symbol" :value="item.symbol">
          {{ item.label }}
      </option>
    </select>
  </label>
</template>
