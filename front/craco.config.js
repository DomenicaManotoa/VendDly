const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#1DA57A', // Color primario personalizado
              '@link-color': '#1DA57A',    // Color de enlaces
              '@border-radius-base': '5px', // Radio de bordes
            },
            javascriptEnabled: true,
          },
        },
        cssLoaderOptions: {
          modules: {
            localIdentName: "[local]--[hash:base64:5]",
          },
        },
      },
    },
  ],
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false
      };
      return webpackConfig;
    }
  }
};