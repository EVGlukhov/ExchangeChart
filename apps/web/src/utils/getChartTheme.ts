import type { ChartTheme } from '../types/chartTheme'

/**
 * Reads CSS custom properties from the root element and assembles the
 * canvas chart theme.
 *
 * @returns The theme object containing colors, font, and tooltip dimensions.
 */
export function getChartTheme(): ChartTheme {
  const styles = getComputedStyle(document.documentElement)

  return {
    candles: {
      rising: styles.getPropertyValue('--chart-candle-up').trim(),
      falling: styles.getPropertyValue('--chart-candle-down').trim(),
    },
    axis: {
      text: styles.getPropertyValue('--chart-axis-text').trim(),
      font: styles.getPropertyValue('--chart-axis-font').trim(),
    },
    grid: styles.getPropertyValue('--chart-grid').trim(),
    crosshair: styles.getPropertyValue('--chart-crosshair').trim(),
    tooltip: {
      width: Number.parseFloat(styles.getPropertyValue('--chart-tooltip-width')),
      height: Number.parseFloat(styles.getPropertyValue('--chart-tooltip-height')),
      offset: Number.parseFloat(styles.getPropertyValue('--chart-tooltip-offset')),
    },
  }
}
