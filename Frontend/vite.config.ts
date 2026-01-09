import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { execSync } from 'child_process'

// 自动计算版本号（优先使用 CI 环境变量，否则从 git 历史计算）
function getVersion(): string {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION
  }
  try {
    // 调用版本脚本计算: {tag数量}.{开发天数}.{当天commit序号}
    return execSync('node ../scripts/version.js', { encoding: 'utf8', cwd: __dirname }).trim()
  } catch {
    // 回退到 package.json
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./package.json').version || '0.0.0'
  }
}

// 获取构建日期
const buildDate = process.env.BUILD_DATE || new Date().toISOString().split('T')[0]
const appVersion = getVersion()

console.log(`📦 Building version: ${appVersion} (${buildDate})`)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: 'default',
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: '**/*.svg',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 优化构建
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'chart-vendor': ['recharts'],
          'radix-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // 开发服务器配置
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  // 清除控制台警告
  clearScreen: false,
  // Tauri 期望一个固定端口
  envPrefix: ['VITE_', 'TAURI_'],
  // 注入构建时常量
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})
