import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/aurore/',
  server: {
    hmr: {
      overlay: false, // Desactiva el overlay de errores para mejor UX
    },
    watch: {
      usePolling: false, // Usa eventos del sistema de archivos (más rápido)
      interval: 100, // Intervalo mínimo para polling si es necesario
    },
  },
  optimizeDeps: {
    force: false, // No forzar re-dependencias en cada cambio
  },
})
