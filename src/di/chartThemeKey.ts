import type { InjectionKey, Ref } from 'vue'
import type { ChartTheme } from '../types/chartTheme'

export const chartThemeKey: InjectionKey<Ref<ChartTheme>> = Symbol('chartTheme')
