import { IConfig } from 'umi-types';
// ref: https://umijs.org/config/
const { REACT_APP_ENV, KEYBASE_AUTH_SERVER_URL, EMAILS_AUTH_SERVER_URL, TDS_SERVER_URL } = process.env;
const config: IConfig = {
    treeShaking: true,
    define: {
      REACT_APP_ENV: REACT_APP_ENV || false,
      KEYBASE_AUTH_SERVER_URL: KEYBASE_AUTH_SERVER_URL || false,
      EMAILS_AUTH_SERVER_URL: EMAILS_AUTH_SERVER_URL || false,
      TDS_SERVER_URL: TDS_SERVER_URL || false,
    },
    plugins: [
      // ref: https://umijs.org/plugin/umi-plugin-react.html
      ['umi-plugin-react', {
        antd: true,
        dva: true,
        dynamicImport: { webpackChunkName: true },
        title: 'Stellot - Voting platform powered by Stellar blockchain',
        dll: true,
        locale: {
          enable: true,
          default: 'en-US',
        },
        routes: {
          exclude: [
            /models\//,
            /services\//,
            /model\.(t|j)sx?$/,
            /service\.(t|j)sx?$/,
            /components\//,
          ],
        },
      }],
      ['babel-plugin-styled-components', {}],
    ],
    theme: {
      // "primary-color": "#8EE3C3",
      // "primary-color": "#7ECBB4",
      "primary-color": "#6c72f9",
      "layout-header-padding": "0",
      "table-header-bg": "#fff",
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
    copy: [{
      from: 'CNAME',
      to: '.'
    }],
    outputPath: '../docs'
  }
;

export default config;
