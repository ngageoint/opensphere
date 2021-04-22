goog.provide('plugin.file.csv.ui.CSVImportUI');

goog.require('os.data.DataManager');
goog.require('os.ui.file.csv');
goog.require('os.ui.file.ui.csv.ConfigStep');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');
goog.require('os.ui.wiz.GeometryStep');
goog.require('os.ui.wiz.OptionsStep');
goog.require('os.ui.wiz.step.TimeStep');
goog.require('plugin.file.csv.CSVDescriptor');
goog.require('plugin.file.csv.CSVParserConfig');
goog.require('plugin.file.csv.CSVProvider');
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
  plugin.file.csv.ui.CSVImportUI.base(this, 'launchUI', file, opt_config);

  const config = new plugin.file.csv.CSVParserConfig();

  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  config['file'] = file;
  config['title'] = file.getFileName();
  config.updateLinePreview();

  if (opt_config && opt_config['defaultImport']) {
    this.handleDefaultImport(file, config);
    return;
  }

  const steps = [
    new os.ui.file.ui.csv.ConfigStep(),
    new os.ui.wiz.GeometryStep(),
    new os.ui.wiz.step.TimeStep(),
    new os.ui.wiz.OptionsStep()
  ];

  const scopeOptions = {
    'config': config,
    'steps': steps
  };
  const windowOptions = {
    'label': 'CSV Import',
    'icon': 'fa fa-sign-in',
    'x': 'center',
    'y': 'center',
    'width': '900',
    'min-width': '500',
    'max-width': '2000',
    'height': '700',
    'min-height': '500',
    'max-height': '2000',
    'modal': true,
    'show-close': true
  };
  const template = '<csvimport resize-with="' + os.ui.windowSelector.WINDOW + '"></csvimport>';
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


/**
 * @inheritDoc
 */
plugin.file.csv.ui.CSVImportUI.prototype.getDefaultConfig = function(file, config) {
  // use the default expected CSV config values before doing the preview and mapping autodetection
  const conf = os.ui.file.csv.DEFAULT_CONFIG;
  config['color'] = conf['color'];
  config['commentChar'] = conf['commentChar'];
  config['dataRow'] = conf['dataRow'];
  config['delimiter'] = conf['delimiter'];
  config['headerRow'] = conf['headerRow'];
  config['useHeader'] = conf['useHeader'];

  try {
    config.updatePreview();

    const features = config['preview'];
    if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
      // no mappings have been set yet, so try to auto detect them
      const mm = os.im.mapping.MappingManager.getInstance();
      const mappings = mm.autoDetect(features);
      if (mappings && mappings.length > 0) {
        config['mappings'] = mappings;
      }
    }
  } catch (e) {
  }

  return config;
};


/**
 * @inheritDoc
 */
plugin.file.csv.ui.CSVImportUI.prototype.handleDefaultImport = function(file, config) {
  config['file'] = file;
  config['title'] = file.getFileName();

  config = this.getDefaultConfig(file, config);

  // create the descriptor and add it
  if (config) {
    const descriptor = plugin.file.csv.CSVDescriptor.createFromConfig(config);
    plugin.file.csv.CSVProvider.getInstance().addDescriptor(descriptor);
    os.data.DataManager.getInstance().addDescriptor(descriptor);
    descriptor.setActive(true);
  }
};
