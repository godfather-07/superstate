import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product: resolve(__dirname, 'products/sleep-well/index.html'),
        story: resolve(__dirname, 'pages/our-story/index.html'),
        faqs: resolve(__dirname, 'pages/faqs/index.html'),
        contact: resolve(__dirname, 'pages/contact/index.html'),
        waitlist: resolve(__dirname, 'pages/waitlist/index.html'),
        getPlan: resolve(__dirname, 'pages/get-plan/index.html'),
        prebook: resolve(__dirname, 'pages/prebook/index.html'),
      },
    },
  },
});
