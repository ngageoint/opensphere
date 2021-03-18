const ClosurePlugin = require('@ngageoint/closure-webpack-plugin');
const path = require('path');

const buildDir = path.resolve(__dirname, '.build');

module.exports = (env, argv) => {
  const depsFile = path.join(buildDir, 'deps-test.js');

  return {
    entry: [
      path.join(buildDir, 'index-test.js')
    ],
    output: {
      path: buildDir,
      filename: 'test.bundle.js'
    },
    // inline-source-map is required so coverage instrumentation does not appear when debugging
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
      rules: [
        // instrument sources with coverage code
        {
          use: {loader: '@ngageoint/opensphere-coverage-loader'},
          include: path.resolve('src'),
          test: /\.js$/
        }
      ]
    },
    plugins: [
      new ClosurePlugin.LibraryPlugin({
        closureLibraryBase: require.resolve('google-closure-library/closure/goog/base'),
        deps: [
          require.resolve('google-closure-library/closure/goog/deps'),
          depsFile
        ]
      })
    ]
  };
};
