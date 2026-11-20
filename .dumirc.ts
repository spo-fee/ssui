import { defineConfig } from 'dumi';
import { resolve } from 'node:path';

export default defineConfig({
  locales: [{ id: 'zh-CN', name: '中文' }],
  themeConfig: {
    name: 'assui',
    deviceWidth: 375,
    footer: false,
    hd: {
      rules: [
        { maxWidth: 375, mode: 'vw', options: [100, 750] },
        { minWidth: 376, maxWidth: 750, mode: 'vw', options: [100, 1500] },
      ],
    },
    socialLinks: {
      github: 'https://github.com/spo-fee/ssui',
    },
  },
  resolve: {
    docDirs: ['docs'],
    atomDirs: [
      { type: 'assui', dir: 'packages/assui/src' },
      { type: 'a-icons', dir: 'packages/a-icons' },
      { type: 'utils', dir: 'packages/aa-utils/src' },
      { type: 'ec-common', dir: 'packages/ec-common/src/consts' },
      { type: 'amssui', dir: 'packages/amssui/src' },
    ],
  },
  alias: {
    'aa-utils': resolve(__dirname, 'packages/aa-utils'),
    'assui': resolve(__dirname, 'packages/assui'),
    'a-icons': resolve(__dirname, 'packages/a-icons'),
    'amssui': resolve(__dirname, 'packages/amssui'),
  },
  chainWebpack(memo) {
    memo.module.rules.delete('svg');
    memo.module
      .rule('svg')
      .test(/\.svg$/)
      .use('svg')
      .loader('@svgr/webpack');
  },
  links: [
    { rel: 'stylesheet', href: '/ssui/antd.min.css' }, // fix product demo no antd styles
    { rel: 'stylesheet', href: '/ssui/single-img-upload.css' },
    { rel: 'stylesheet', href: '/ssui/split-pane.css' },
    { rel: 'stylesheet', href: '/ssui/highlight-textarea.css' },
    { rel: 'stylesheet', href: '/ssui/a-select.css' },
    { rel: 'stylesheet', href: '/ssui/area-text.css' },
    { rel: 'stylesheet', href: '/ssui/color-select.css' },
  ],
  extraBabelPlugins: [
    [
      'babel-plugin-import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
      },
      'antd',
    ],

    [
      'babel-plugin-import',
      {
        libraryName: 'assui',
        libraryDirectory: 'es',
        style: true,
      },
      'assui',
    ],
    [
      'babel-plugin-import',
      {
        libraryName: 'amssui',
        libraryDirectory: 'es',
        style: true,
      },
      'amssui',
    ],
    [
      'babel-plugin-import',
      {
        libraryName: 'a-icons',
        style: false,
        camel2DashComponentName: false,
      },
      'a-icons',
    ],
    [
      'babel-plugin-import',
      {
        libraryName: 'aa-utils',
        style: false,
        camel2DashComponentName: false,
      },
      'aa-utils',
    ],
  ],
});
