import {
  scaleLinear,
  scaleTime,
  type ScaleLinear,
  type ScaleTime,
} from "d3-scale";
import type { Candle } from "../types/candle";

export const CHART_MARGIN = {
  top: 16,
  right: 72,
  bottom: 28,
  left: 12,
} as const;

type ChartScales = {
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
};

interface ChartSize {
  width: number;
  height: number;
}

export function createChartScales(
  candles: readonly Candle[],
  { width, height }: ChartSize,
): ChartScales | null {
  const { top, right, bottom, left } = CHART_MARGIN;

  if (candles.length === 0 || width <= left + right || height <= top + bottom) {
    return null;
  }

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  if (!firstCandle || !lastCandle) {
    return null;
  }

  const lowestPrice = Math.min(...candles.map((candle) => candle.low));
  const highestPrice = Math.max(...candles.map((candle) => candle.high));
  const priceRange = highestPrice - lowestPrice;
  const padding = priceRange * 0.05 || Math.abs(highestPrice) * 0.005 || 1;

  const x = scaleTime()
    .domain([new Date(firstCandle.time), new Date(lastCandle.time)])
    .range([left, width - right]);

  const y = scaleLinear()
    .domain([lowestPrice - padding, highestPrice + padding])
    .nice()
    .range([height - bottom, top]);

  return { x, y };
}
