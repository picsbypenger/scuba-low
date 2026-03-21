import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true, // Automatically opens the analyzer in your browser after building
      gzipSize: true, // Shows the gzip size (the most important metric)
      brotliSize: true, // Shows brotli size if you use that compression
      filename: "dist/stats.html" // Where to save the report
    })
  ],
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          minSize: 20000,
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
})
