goog.provide('plugin.georss.GeoRSSImportUI');

goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.georss.georssImportDirective');


/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
plugin.georss.GeoRSSImportUI = function() {
  plugin.georss.GeoRSSImportUI.base(this, 'constructor');
};
goog.inherits(plugin.georss.GeoRSSImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
// Let's be honest, testing getters like this is pedantic. Let's ignore it
// this time.
/* istanbul ignore next */
plugin.georss.GeoRSSImportUI.prototype.getTitle = function() {
  return 'GeoRSS';
};


/**
 * @inheritDoc
 */
// TODO: This function doesn't do much yet, after it does, let's test the
// finished product.
/* istanbul ignore next */
plugin.georss.GeoRSSImportUI.prototype.launchUI = function(file, opt_config) {
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
    'label': 'Import GeoRSS',
    'icon': 'fa fa-file-text lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': 350,
    'min-width': 350,
    'max-width': 600,
    'height': 'auto',
    'modal': true,
    'show-close': true,
    'no-scroll': true
  };
  var template = '<georssimport></georssimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
