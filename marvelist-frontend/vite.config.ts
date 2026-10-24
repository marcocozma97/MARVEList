import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Espone il dev server sulla rete locale, così si apre anche dallo smartphone
  server: { host: true },
})
