import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        (process.env.VITE_SUPABASE_URL || 'https://nbasiawyntilkdfekfqo.supabase.co')
          .trim()
          .replace(/\/+$/, '')
          .replace(/\/rest\/v1\/?$/i, '')
          .replace(/\/rest\/?$/i, '')
          .replace(/\/auth\/v1\/?$/i, '')
          .replace(/\/+$/, '')
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYXNpYXd5bnRpbGtkZmVrZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzI1NzcsImV4cCI6MjEwNTI0ODU3N30.MakIa5Wz8tt1hmLaHeG8UcphK1zlbTp5xrF7sICA-3c'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
