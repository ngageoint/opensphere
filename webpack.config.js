const ClosurePlugin = require('@ngageoint/closure-webpack-plugin');
const path = require('path');

const buildDir = path.resolve(__dirname, '.build');
const gccOptions = require(path.join(buildDir, 'gcc-webpack'));

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production' || !argv.mode;

  return {
    entry: [
      path.join(buildDir, 'index.js')
    ],
    output: {
      path: buildDir,
      filename: isProduction ? 'opensphere.min.js' : 'opensphere.js'
    },
    devtool: isProduction ? 'source-map' : 'eval',
    watch: !isProduction,
    optimization: {
      minimize: isProduction,
      minimizer: [
        new ClosurePlugin({
          mode: 'AGGRESSIVE_BUNDLE',
          platform: 'java'
        }, gccOptions)
      ],
      concatenateModules: false,
      splitChunks: {
        minSize: 0
      }
    },
    plugins: [
      new ClosurePlugin.LibraryPlugin({
        closureLibraryBase: require.resolve('google-closure-library/closure/goog/base'),
        deps: [
          require.resolve('google-closure-library/closure/goog/deps'),
          require.resolve('opensphere/.build/deps')
        ]
      })
    ]
  };
};
