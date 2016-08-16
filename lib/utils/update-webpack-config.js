'use strict';

const path = require('path');
const webpack = require('ljtool-build/lib/webpack');
const getConfig = require('./get-config');
const resolvePlugins = require('./resolve-plugins');
const bishengLib = path.join(__dirname, '..');
const bishengLibLoaders = path.join(bishengLib, 'loaders');

module.exports = function updateWebpackConfig(webpackConfig, configFile, isBuild) {
  const config = getConfig(configFile);

  /* eslint-disable no-param-reassign */
  webpackConfig.entry = {};
  if (isBuild) {
    webpackConfig.output.path = config.output;
  }
  webpackConfig.output.publicPath = isBuild ? config.root : '/';
  webpackConfig.module.loaders.push({
    test(filename) {
      return filename === path.join(bishengLib, 'utils', 'data.js');
    },
    loader: `${path.join(bishengLibLoaders, 'bisheng-data-loader')}` +
      `?config=${configFile}`,
  });

  webpackConfig.module.loaders.push({
    test: /\.md$/,
    exclude: /node_modules/,
    loaders: [
      'babel',
      `${path.join(bishengLibLoaders, 'markdown-loader')}?config=${configFile}`,
    ],
  });
  /* eslint-enable no-param-reassign */

  const pluginsConfig = resolvePlugins(config.plugins, 'config');
  pluginsConfig.forEach((pluginConfig) => {
    require(pluginConfig[0])(pluginConfig[1]).webpackConfig(webpackConfig, webpack);
  });

  const customizedWebpackConfig = config.webpackConfig(webpackConfig, webpack);

  Object.keys(config.entry).forEach((key) => {
    const entryPath = path.join(bishengLib, '..', 'tmp', 'entry.' + key + '.js');
    if (customizedWebpackConfig.entry[key]) {
      throw new Error('Should not set `webpackConfig.entry.' + key + '`!');
    }
    customizedWebpackConfig.entry[key] = entryPath;
    customizedWebpackConfig.module.loaders.push({
      test: (filename) => {
        return filename === entryPath;
      },
      loader: 'babel',
    });
  });
  return customizedWebpackConfig;
};
