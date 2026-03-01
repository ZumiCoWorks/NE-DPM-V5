var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
    plugins: __spreadArray([
        react({
            babel: {
                plugins: [
                    'react-dev-locator',
                ],
            },
        }),
        tsconfigPaths()
    ], (process.env.NODE_ENV === 'production' ? [VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 // 3MB limit for large bundles
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'NavEase',
                short_name: 'NavEase',
                description: 'The Ultimate Event Navigation Experience',
                theme_color: '#ed1c24',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })] : []), true),
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
