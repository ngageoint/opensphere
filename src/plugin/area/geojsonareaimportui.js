goog.provide('plugin.area.GeoJSONAreaImportUI');

goog.require('os.query.ui.AreaOptionsStep');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.GeometryStep');
goog.require('plugin.area.geojsonAreaImportDirective');
goog.require('plugin.file.geojson.GeoJSONParserConfig');
goog.require('plugin.file.geojson.geojsonImportDirective');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.geojson.GeoJSONParserConfig>}
 * @constructor
 */
plugin.area.GeoJSONAreaImportUI = function() {
  plugin.area.GeoJSONAreaImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(plugin.area.GeoJSONAreaImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.area.GeoJSONAreaImportUI.prototype.getTitle = function() {
  return 'Area Import - GeoJSON';
};


/**
 * @inheritDoc
 */
plugin.area.GeoJSONAreaImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.area.GeoJSONAreaImportUI.base(this, 'launchUI', file, opt_config);
  var steps = [
    new os.ui.wiz.GeometryStep(),
    new os.query.ui.AreaOptionsStep()
  ];

  var config = new plugin.file.geojson.GeoJSONParserConfig();

  // if a configuration was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();

  var scopeOptions = {
    'config': config,
    'steps': steps
  };
  var windowOptions = {
    'label': 'GeoJSON Area Import',
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '850',
    'min-width': '500',
    'max-width': '1200',
    'height': '650',
    'min-height': '300',
    'max-height': '1000',
    'modal': 'true',
    'show-close': 'true',
    'no-scroll': 'true'
  };
  var template = '<geojsonareaimport resize-with="' + os.ui.windowSelector.WINDOW + '"></geojsonareaimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
