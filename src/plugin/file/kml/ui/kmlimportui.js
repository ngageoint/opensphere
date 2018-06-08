goog.provide('plugin.file.kml.ui.KMLImportUI');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.file.kml.ui.kmlImportDirective');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.file.kml.ui.KMLImportUI = function() {
  plugin.file.kml.ui.KMLImportUI.base(this, 'constructor');
};
goog.inherits(plugin.file.kml.ui.KMLImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLImportUI.prototype.getTitle = function() {
  return 'KML';
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.FileParserConfig();

  // if an existing config was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'Import KML',
    'icon': 'fa fa-file-text lt-blue-icon',
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
  var template = '<kmlimport></kmlimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
