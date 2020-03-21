import { IConfig } from 'umi-types';
// ref: https://umijs.org/config/
const config: IConfig = {
    treeShaking: true,
    plugins: [
      // ref: https://umijs.org/plugin/umi-plugin-react.html
      ['umi-plugin-react', {
        antd: true,
        dva: true,
        dynamicImport: { webpackChunkName: true },
        title: 'app',
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
    },
    copy: [{
      from: 'CNAME',
      to: '.'
    }],
    outputPath: '../docs'
  }
;

export default config;
