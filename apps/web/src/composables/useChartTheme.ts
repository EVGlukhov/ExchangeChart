import { inject } from 'vue'
import { chartThemeKey } from '../di/chartThemeKey'

/**
 * Retrieves the chart theme from the Vue provide/inject context.
 *
 * @returns The reactive theme provided by the root application component.
 * @throws {Error} If called outside a component that provides the theme.
 */
export function useChartTheme() {
  const chartTheme = inject(chartThemeKey)

  if (!chartTheme) {
    throw new Error('Chart theme was not provided')
  }

  return chartTheme
}
