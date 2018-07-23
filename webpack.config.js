var webpack = require('webpack');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var StringReplace = require("string-replace-webpack-plugin");
var VERSION = require('./src/goserver/config.json').config.version;
var SKINS = require('./src/goserver/config.json').config.version;
var CORE_IP;

var plugins = [new StringReplace()];
var production = process.env.NODE_ENV === "production";
var mobile = !!process.env.MOBILE;

if(production){
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false,
        pure_funcs: ['console.log']
      },
      output: {comments:false}
    })
  );

  CORE_IP = require('./src/goserver/config.json').config.coreIpProd;
}else{
  CORE_IP = require('./src/goserver/config.json').config.coreIpDev;
}

plugins.push(function() {
  this.plugin("done", function(statsData) {
    var stats = statsData.toJson();

    if (!stats.errors.length) {
      //find old bundles
      var bundleName = "game." + stats.hash + ".js";
      var bundlePath = path.join(__dirname, "./build/client/");
      var folderFiles = _.filter(fs.readdirSync(bundlePath), function(file){
        if(file === bundleName || file === bundleName+".map")return false;
        return /game.[\d|\S]*.js(\S*)/.test(file);
      });

      //delete old bundles
      if(folderFiles.length){
        _.each(folderFiles,function(file){
          fs.unlinkSync(path.join(bundlePath, file));
        });
      }

      var htmlFileName = "index.html";
      var html = fs.readFileSync(path.join(__dirname, './src/client/', htmlFileName), "utf8");
      var changelog = fs.readFileSync(path.join(__dirname, './src/changelog.html'), "utf8");

      var htmlOutput = html.replace("<%= hash %>", stats.hash);
      htmlOutput = htmlOutput.replace("<%= CHANGELOG %>", changelog);
      htmlOutput = htmlOutput.replace("<%= GAME_VERSION %>", VERSION);

      fs.writeFileSync(path.join(__dirname, "./build/client/", htmlFileName), htmlOutput);
    }
  });
});

module.exports = {
  devtool: production ? null : 'source-map',
  entry: ['pixi.js', './src/client/index.ts'],
  output: {
    filename: mobile ? "./src/mobile/www/game.js" : "./build/client/game.[hash].js"
  },
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    alias: {"events" : "pixi.js"}
  },
  plugins: plugins,
  module: {
    postLoaders: [
      {
        loader: "transform/cacheable?brfs"
      },
      {
        loader: StringReplace.replace({
          replacements: [
            {
              pattern: /<--GAME_VERSION-->/ig,
              replacement: function(match, pi, offset, string){
                return VERSION;
              }
            },
            {
              pattern: /<--CORE_IP-->/ig,
              replacement: function(match, pi, offset, string){
                return CORE_IP;
              }
            }
          ]
        })
      }
    ],
    loaders: [
      {
        test: /\.json$/,
        include: [
          path.join(__dirname, 'node_modules', 'pixi.js')
        ],
        loader: 'json'
      },
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      { test: /\.tsx?$/, loader: "ts-loader", exclude: path.resolve(__dirname, 'src', 'server') }
    ]
  }
};
