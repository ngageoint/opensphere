goog.provide('plugin.file.gpx.ui.GPXImportUI');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.file.gpx.ui.gpxImportDirective');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.file.gpx.ui.GPXImportUI = function() {
  plugin.file.gpx.ui.GPXImportUI.base(this, 'constructor');
};
goog.inherits(plugin.file.gpx.ui.GPXImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.gpx.ui.GPXImportUI.prototype.getTitle = function() {
  return 'GPX';
};


/**
 * @inheritDoc
 */
plugin.file.gpx.ui.GPXImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.file.gpx.ui.GPXImportUI.base(this, 'launchUI', file, opt_config);

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
    'label': 'Import GPX',
    'icon': 'fa fa-file-text lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': '350',
    'min-width': '350',
    'max-width': '600',
    'height': '250',
    'min-height': '250',
    'max-height': '500',
    'modal': 'true',
    'show-close': 'true',
    'no-scroll': 'true'
  };
  var template = '<gpximport></gpximport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
