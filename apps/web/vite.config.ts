import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue(), tailwindcss(), svgLoader()],
  server: {
    proxy: {
      '/api/testnet': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
