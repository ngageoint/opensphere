const path = require('path');
const ClosurePlugin = require('@ngageoint/closure-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const buildDir = path.resolve(__dirname, '.build');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production' || !argv.mode;
  const depsFile = path.join(buildDir, 'deps.js');

  return {
    mode: argv.mode,
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
      minimizer: [new TerserPlugin({
        terserOptions: {
          mangle: false
        }
      })],
      concatenateModules: false,
      splitChunks: {
        minSize: 0
      }
    },
    performance: {
      // In production, warn if the asset size exceeds 5MB
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 5000000,
      maxEntrypointSize: 5000000
    },
    plugins: [
      new ClosurePlugin.LibraryPlugin({
        closureLibraryBase: require.resolve('google-closure-library/closure/goog/base'),
        deps: [
          require.resolve('google-closure-library/closure/goog/deps'),
          depsFile
        ],
        mode: 'development'
      })
    ]
  };
};
