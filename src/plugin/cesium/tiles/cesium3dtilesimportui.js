goog.provide('plugin.cesium.tiles.TilesetImportUI');

goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.cesium.tiles');
goog.require('plugin.cesium.tiles.tilesetImportDirective');



/**
 * Import UI for 3D tiles.
 * @extends {os.ui.im.FileImportUI<Object>}
 * @constructor
 */
plugin.cesium.tiles.TilesetImportUI = function() {
  plugin.cesium.tiles.TilesetImportUI.base(this, 'constructor');
};
goog.inherits(plugin.cesium.tiles.TilesetImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.TilesetImportUI.prototype.getTitle = function() {
  return plugin.cesium.tiles.TYPE;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.TilesetImportUI.prototype.launchUI = function(file, opt_config) {
  var config = {};

  // if a configuration was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = 'New 3D Tile Layer';

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'Import ' + plugin.cesium.tiles.TYPE,
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': 400,
    'min-width': 400,
    'max-width': 800,
    'height': 'auto',
    'modal': true,
    'show-close': true,
    'no-scroll': true
  };
  var template = '<tilesetimport></tilesetimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
