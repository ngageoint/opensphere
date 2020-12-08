goog.provide('plugin.file.zip.ui.ZIPImportUI');

goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('plugin.file.zip.ZIPParserConfig');
goog.require('plugin.file.zip.ui.zipImportDirective');


/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.zip.ZIPParserConfig>}
 * @constructor
 */
plugin.file.zip.ui.ZIPImportUI = function() {
  plugin.file.zip.ui.ZIPImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(plugin.file.zip.ui.ZIPImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportUI.prototype.getTitle = function() {
  return 'ZIP';
};


/**
 * @inheritDoc
 */
plugin.file.zip.ui.ZIPImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.file.zip.ui.ZIPImportUI.base(this, 'launchUI', file, opt_config);

  var config = new plugin.file.zip.ZIPParserConfig();

  // if a configuration was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file; // set the file

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'ZIP Import',
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '650',
    'min-width': '500',
    'max-width': '1200',
    'height': '360',
    'min-height': '300',
    'max-height': '1000',
    'modal': 'true',
    'show-close': 'true'
  };
  var template = '<zipimport resize-with="' + os.ui.windowSelector.WINDOW + '"></zipimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
