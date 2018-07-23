var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  target: 'node',
  node: {
    __dirname: true,
    __filename: true,
    process: true
  },
  devtool: 'source-map',
  entry: ['./src/server/index.ts'],
  output: {
    filename: "./build/server/app.js"
  },
  externals: nodeModules,
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  plugins: [
    new webpack.BannerPlugin('require("source-map-support").install();', { raw: true, entryOnly: false })
  ],
  module: {
    loaders: [
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      { test: /\.tsx?$/, loader: "ts-loader", exclude: path.resolve(__dirname, 'src', 'client') },
      { test: /\.json$/, loader: "json-loader"}
    ]
  }
};
