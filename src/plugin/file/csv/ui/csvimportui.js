goog.provide('plugin.file.csv.ui.CSVImportUI');
goog.require('os.ui.file.ui.csv.ConfigStep');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.GeometryStep');
goog.require('os.ui.wiz.OptionsStep');
goog.require('os.ui.wiz.step.TimeStep');
goog.require('plugin.file.csv.CSVParserConfig');
goog.require('plugin.file.csv.ui.csvImportDirective');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.csv.CSVParserConfig>}
 * @constructor
 */
plugin.file.csv.ui.CSVImportUI = function() {
  plugin.file.csv.ui.CSVImportUI.base(this, 'constructor');
};
goog.inherits(plugin.file.csv.ui.CSVImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.csv.ui.CSVImportUI.prototype.getTitle = function() {
  return 'CSV';
};


/**
 * @inheritDoc
 */
plugin.file.csv.ui.CSVImportUI.prototype.launchUI = function(file, opt_config) {
  var steps = [
    new os.ui.file.ui.csv.ConfigStep(),
    new os.ui.wiz.GeometryStep(),
    new os.ui.wiz.step.TimeStep(),
    new os.ui.wiz.OptionsStep()
  ];

  var config = new plugin.file.csv.CSVParserConfig();

  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();
  config.updateLinePreview();

  var scopeOptions = {
    'config': config,
    'steps': steps
  };
  var windowOptions = {
    'label': 'CSV Import',
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
  var template = '<csvimport resize-with="' + os.ui.windowSelector.WINDOW + '"></csvimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @inheritDoc
 */
plugin.file.csv.ui.CSVImportUI.prototype.mergeConfig = function(from, to) {
  plugin.file.csv.ui.CSVImportUI.base(this, 'mergeConfig', from, to);

  to['commentChar'] = from['commentChar'];
  to['dataRow'] = from['dataRow'];
  to['delimiter'] = from['delimiter'];
  to['headerRow'] = from['headerRow'];
  to['useHeader'] = from['useHeader'];
};
