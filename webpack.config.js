var path = require('path')

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');
process.env.MY_APPLICATION_NAME_ARGS = JSON.stringify(process.argv)
console.log(process.env)
var webpackConfig = {
  mode: 'production',
  entry: {
    cleveland: './src/integration/cleveland/cleveland.js',
    groupedStackedAB: './src/integration/groupedStackedAB/groupedStackedAB.js',
    groupedStacked: './src/integration/groupedStacked/groupedStacked.js',
    violin: './src/integration/violin/violin.js',
    test: './src/integration/test/test.js',
    splitViolin: './src/integration/splitViolin/splitViolin.js',
    bulletChart: './src/integration/bulletChart/bulletChart.js',
    bulletChart: './src/integration/bulletChart/bulletChart.js',
    coloredBars: './src/integration/coloredBars/coloredBars.js',
    coloredBarsPerc: './src/integration/coloredBarsPerc/coloredBarsPerc.js',
    template: './src/integration/template/template.js',
    line: './src/integration/line/line.js',
    fever: './src/integration/fever/fever.js'
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "dist"),
    library: "[name]",
    libraryTarget: "umd"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new UglifyJSPlugin(),
    new webpack.DefinePlugin({
      'process.env.YOUR_UNIQUE_VARIABLE': JSON.stringify(process.env.YOUR_UNIQUE_VARIABLE)
    })
  ],
  module: {
    rules: [
      { test: /\.js$/, loader: "babel-loader" },
      { test: /\.ts$/, loader: "ts-loader" },
      { test: /\.css$/, loader: [ 'to-string-loader', 'css-loader' ] }
    ]
  },
  stats: {
    warningsFilter: /export.*liquidfillgauge.*was not found/
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
}

module.exports = webpackConfig
