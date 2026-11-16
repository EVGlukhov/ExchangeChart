<script setup lang="ts">
import { provide, ref, shallowRef } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import ChartPanel from './components/ChartPanel.vue'
import RecentTrades from './components/RecentTrades.vue'
import { MARKET, TIMEFRAME, type Market, type Timeframe } from './constants/chart.ts'
import type { ChartTheme } from './types/chartTheme.ts'
import { getChartTheme } from './utils/getChartTheme.ts'
import { chartThemeKey } from './di/chartThemeKey.ts'
import OpenOrders from './components/OpenOrders.vue'

const market = ref<Market>(MARKET.BTC_USDT)
const timeframe = ref<Timeframe>(TIMEFRAME.HOUR_1)

const chartTheme = shallowRef<ChartTheme>(getChartTheme())
provide(chartThemeKey, chartTheme)
</script>
<template>
  <main class="bg-binance-page text-binance-text min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-screen-2xl">
      <HeaderBar v-model="market" />
      <div class="mt-4 overflow-x-auto">
        <div class="grid min-w-208 grid-cols-[minmax(0,1fr)_14rem] gap-4">
          <ChartPanel v-model="timeframe" :market="market" />
          <RecentTrades :market="market" />
          <OpenOrders class="col-span-2" :market="market" />
        </div>
      </div>
    </div>
  </main>
</template>
