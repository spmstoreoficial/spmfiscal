import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          '**/database_spm_fiscal.sql',
          '**/Notas_Fiscais/**',
          '**/uploads/**',
          '**/*.sql',
          '**/*.xlsx',
          '**/*.xls',
          '**/*.csv',
          '**/*.pdf',
          '**/*.bat',
          '**/*.ps1',
          '**/.git/**',
          '**/dist/**'
        ]
      },
    },
  };
});
