goog.provide('plugin.file.shp.ui.SHPImportUI');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.OptionsStep');
goog.require('os.ui.wiz.step.TimeStep');
goog.require('plugin.file.shp.SHPParserConfig');
goog.require('plugin.file.shp.mime');
goog.require('plugin.file.shp.ui.SHPFilesStep');
goog.require('plugin.file.shp.ui.shpImportDirective');



/**
 * @extends {os.ui.im.FileImportUI.<plugin.file.shp.SHPParserConfig>}
 * @constructor
 */
plugin.file.shp.ui.SHPImportUI = function() {
  plugin.file.shp.ui.SHPImportUI.base(this, 'constructor');
};
goog.inherits(plugin.file.shp.ui.SHPImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
plugin.file.shp.ui.SHPImportUI.prototype.getTitle = function() {
  return 'SHP';
};


/**
 * @inheritDoc
 */
plugin.file.shp.ui.SHPImportUI.prototype.launchUI = function(file, opt_config) {
  plugin.file.shp.ui.SHPImportUI.base(this, 'launchUI', file, opt_config);

  var steps = [
    new plugin.file.shp.ui.SHPFilesStep(),
    new os.ui.wiz.step.TimeStep(),
    new os.ui.wiz.OptionsStep()
  ];

  var config = new plugin.file.shp.SHPParserConfig();

  // if a configuration was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  // determine if the initial file is the DBF or SHP file
  var name = file.getFileName();
  if (plugin.file.shp.mime.SHP_EXT_REGEXP.test(name)) {
    config['file'] = file;
    config['title'] = name;
  } else {
    config['file2'] = file;
    config['title'] = name.split(plugin.file.shp.mime.DBF_EXT_REGEXP)[0] + '.shp';
  }

  var scopeOptions = {
    'config': config,
    'steps': steps
  };
  var windowOptions = {
    'label': 'SHP Import',
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
  var template = '<shpimport resize-with=".window"></shpimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
