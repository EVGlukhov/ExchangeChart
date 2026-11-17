const orderNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
})

const marketPriceFormatter = new Intl.NumberFormat('en-US', {
  minimumSignificantDigits: 8,
})

const tradePriceFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
})

const tradeQuantityFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 6,
})

const headerVolumeFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const axisVolumeFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const axisPriceFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 6,
})

export function formatOrderNumber(value: string | number | undefined): string {
  if (value === undefined) return '--'

  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? orderNumberFormatter.format(number) : String(value)
}

export function formatMarketPrice(value: number | undefined): string {
  return value === undefined ? '-' : marketPriceFormatter.format(value)
}

export function formatTradePrice(value: number): string {
  return tradePriceFormatter.format(value)
}

export function formatTradeQuantity(value: number): string {
  return tradeQuantityFormatter.format(value)
}

export function formatHeaderVolume(value: number | undefined): string {
  return value === undefined ? '-' : headerVolumeFormatter.format(value)
}

export function formatAxisVolume(value: number): string {
  return axisVolumeFormatter.format(value)
}

export function formatAxisPrice(value: number): string {
  return axisPriceFormatter.format(value)
}

export function formatPercentChange(value: number | undefined): string {
  return value === undefined ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`
}

export function formatTradeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

export function formatTooltipDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function createTimeAxisFormatter(timeRange: number): Intl.DateTimeFormat {
  const options: Intl.DateTimeFormatOptions =
    timeRange <= 2 * 24 * 60 * 60 * 1000
      ? { hour: '2-digit', minute: '2-digit' }
      : timeRange <= 365 * 24 * 60 * 60 * 1000
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', year: 'numeric' }

  return new Intl.DateTimeFormat(undefined, options)
}
