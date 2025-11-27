import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [
                    'react-dev-locator',
                ],
            },
        }),
        tsconfigPaths(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                configure: function (proxy) {
                    proxy.on('error', function (err) {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', function (proxyReq, req) {
                        console.log('Sending Request to the Target:', req.method, req.url);
                    });
                    proxy.on('proxyRes', function (proxyRes, req) {
                        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                    });
                },
            }
        }
    }
});
