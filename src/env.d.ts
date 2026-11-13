/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BINANCE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
