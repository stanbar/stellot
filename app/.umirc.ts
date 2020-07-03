import { defineConfig } from 'umi';
// ref: https://umijs.org/config/
const {
  REACT_APP_ENV,
  KEYBASE_AUTH_SERVER_URL,
  EMAILS_AUTH_SERVER_URL,
  TDS_SERVER_URL,
} = process.env;

export const pwa = false;

export default defineConfig({
  define: {
    REACT_APP_ENV: REACT_APP_ENV || false,
    KEYBASE_AUTH_SERVER_URL: KEYBASE_AUTH_SERVER_URL || false,
    EMAILS_AUTH_SERVER_URL: EMAILS_AUTH_SERVER_URL || false,
    TDS_SERVER_URL: TDS_SERVER_URL || false,
  },
  pwa,
  hash: true,
  history: {
    type: 'hash',
  },
  base: '/',
  publicPath: '/',
  antd: {},
  dva: {},
  locale: {
    default: 'en-US',
    antd: true,
    baseNavigator: true,
    // antd: true,
  },
  dynamicImport: { loading: '@/components/LoadingPage/index' },
  targets: {
    ie: 11,
  },
  title: 'Stellot - Voting platform powered by Stellar blockchain',
  theme: {
    // "primary-color": "#8EE3C3",
    // "primary-color": "#7ECBB4",
    'primary-color': '#6c72f9',
    'layout-header-padding': '0',
    'table-header-bg': '#fff',
  },
  copy: ['CNAME'],
  outputPath: '../docs',
  manifest: {
    basePath: '/',
  },
  proxy: {
    '/api/': {
      target: 'http://localhost:8082/',
      changeOrigin: true,
      // pathRewrite: {
      //   '^/api': '',
      // },
    },
    '/auth/keybase/': {
      target: 'http://localhost:8083/',
      changeOrigin: true,
      // pathRewrite: {
      //   '^/api': '',
      // },
    },
    '/auth/emails/': {
      target: 'http://localhost:8084/',
      changeOrigin: true,
      // pathRewrite: {
      //   '^/api': '',
      // },
    },
  },
});
