import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

// In production, Vercel runs api/*.js as serverless functions. This plugin
// does the same during `npm run dev`, so the Razorpay checkout works locally.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const name = req.url.split('?')[0].replace(/^\/+|\/+$/g, '');
        if (!/^[a-z0-9-]+$/.test(name)) return next();
        try {
          const mod = await server.ssrLoadModule(resolve(__dirname, `api/${name}.js`));
          await mod.default(req, res);
        } catch (err) {
          if (err && err.code === 'ERR_LOAD_URL') return next();
          console.error(`[api/${name}]`, err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Make non-VITE_ variables (e.g. RAZORPAY_KEY_SECRET) visible to the local
  // API handlers only. They are never exposed to browser code.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [localApi()],
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
  };
});
