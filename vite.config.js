import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          if (id.includes('mapbox-gl')) return 'mapbox'
          if (id.includes('@google/model-viewer')) return 'model-viewer'
          return 'vendor'
        },
      },
    },
  },
})
