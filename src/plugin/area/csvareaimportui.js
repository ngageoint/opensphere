goog.provide('plugin.area.CSVAreaImportUI');

goog.require('os.query.ui.AreaOptionsStep');
goog.require('os.ui.file.ui.csv.ConfigStep');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.GeometryStep');
goog.require('plugin.area.csvAreaImportDirective');
goog.require('plugin.file.csv.CSVParserConfig');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.csv.CSVParserConfig>}
 * @constructor
 */
plugin.area.CSVAreaImportUI = function() {
  plugin.area.CSVAreaImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(plugin.area.CSVAreaImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.area.CSVAreaImportUI.prototype.getTitle = function() {
  return 'Area Import - CSV';
};


/**
 * @inheritDoc
 */
plugin.area.CSVAreaImportUI.prototype.launchUI = function(file, opt_config) {
  var steps = [
    new os.ui.file.ui.csv.ConfigStep(),
    new os.ui.wiz.GeometryStep(),
    new os.query.ui.AreaOptionsStep()
  ];

  var config = new plugin.file.csv.CSVParserConfig();
  config['file'] = file;
  config['title'] = file.getFileName();
  config.updateLinePreview();

  var scopeOptions = {
    'config': config,
    'steps': steps
  };
  var windowOptions = {
    'label': 'CSV Area Import',
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
  var template = '<csvareaimport resize-with=".js-window"></csvareaimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
