<script setup lang="ts">
type Variant = 'display' | 'heading' | 'body' | 'small' | 'caption' | 'overline' | 'control'

type Tone =
  'default' | 'muted' | 'accent' | 'buy' | 'sell' | 'neutral' | 'subtle' | 'emphasis' | 'inherit'

const props = withDefaults(
  defineProps<{
    as?: string
    variant?: Variant
    tone?: Tone
    numeric?: boolean
    mono?: boolean
  }>(),
  {
    as: 'span',
    variant: 'caption',
    tone: 'default',
    numeric: false,
    mono: false,
  },
)

const variants: Record<Variant, string> = {
  display: 'text-lg font-semibold sm:text-xl',
  heading: 'text-sm font-semibold',
  body: 'text-sm',
  small: 'text-xs',
  caption: 'text-2xs',
  overline: 'text-2xs font-medium tracking-wider uppercase',
  control: 'text-sm uppercase',
}

const tones: Record<Tone, string> = {
  default: 'text-binance-text',
  muted: 'text-binance-muted',
  accent: 'text-binance-accent',
  buy: 'text-binance-buy',
  sell: 'text-binance-sell',
  neutral: 'text-gray-200',
  subtle: 'text-gray-400',
  emphasis: 'text-gray-100',
  inherit: 'text-inherit',
}
</script>

<template>
  <component
    :is="props.as"
    :class="[
      variants[props.variant],
      tones[props.tone],
      props.numeric && 'tabular-nums',
      props.mono && 'font-mono',
    ]"
  >
    <slot />
  </component>
</template>
