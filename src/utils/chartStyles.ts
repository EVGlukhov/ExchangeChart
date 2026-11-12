export type ChartStyles = {
  candles: {
    rising: string
    falling: string
  }
  axis: {
    text: string
    font: string
  }
  grid: string
}

export function getChartStyles(): ChartStyles {
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
  }
}
