import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        find: resolve(__dirname, 'find.html'),
        services: resolve(__dirname, 'services.html'),
      },
    },
  },
})
