import { inject } from 'vue'
import { chartThemeKey } from '../di/chartThemeKey'

export function useChartTheme() {
  const chartTheme = inject(chartThemeKey)

  if (!chartTheme) {
    throw new Error('Chart theme was not provided')
  }

  return chartTheme
}
