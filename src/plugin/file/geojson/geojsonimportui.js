goog.provide('plugin.file.geojson.GeoJSONImportUI');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.OptionsStep');
goog.require('os.ui.wiz.step.TimeStep');
goog.require('plugin.file.geojson.GeoJSONParserConfig');
goog.require('plugin.file.geojson.geojsonImportDirective');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.geojson.GeoJSONParserConfig>}
 * @constructor
 */
plugin.file.geojson.GeoJSONImportUI = function() {
  plugin.file.geojson.GeoJSONImportUI.base(this, 'constructor');
};
goog.inherits(plugin.file.geojson.GeoJSONImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONImportUI.prototype.getTitle = function() {
  return 'GeoJSON';
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONImportUI.prototype.launchUI = function(file, opt_config) {
  var steps = [
    new os.ui.wiz.step.TimeStep(),
    new os.ui.wiz.OptionsStep()
  ];

  var config = new plugin.file.geojson.GeoJSONParserConfig();

  // if a configuration was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();

  try {
    config.updatePreview();

    var features = config['preview'].slice(0, 24);
    if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
      // no mappings have been set yet, so try to auto detect them
      var mm = os.im.mapping.MappingManager.getInstance();
      var mappings = mm.autoDetect(features);
      if (mappings && mappings.length > 0) {
        config['mappings'] = mappings;
      }
    }
  } catch (e) {
  }

  var scopeOptions = {
    'config': config,
    'steps': steps
  };
  var windowOptions = {
    'label': 'Import GeoJSON',
    'icon': 'fa fa-sign-in lt-blue-icon',
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
  var template = '<geojsonimport resize-with=".window"></geojsonimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
