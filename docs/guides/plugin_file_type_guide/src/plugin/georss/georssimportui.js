goog.provide('plugin.georss.GeoRSSImportUI');

goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');


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
plugin.georss.GeoRSSImportUI.prototype.getTitle = function() {
  return 'GeoRSS';
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.FileParserConfig();

  // if an existing config was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();

  // our config is all set up but we have no UI to launch yet!
};
