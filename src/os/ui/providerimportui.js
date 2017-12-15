goog.provide('os.ui.ProviderImportUI');
goog.require('os.data.DataManager');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.window');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
os.ui.ProviderImportUI = function() {
  os.ui.ProviderImportUI.base(this, 'constructor');

  // file contents are only used in memory, not loaded from storage
  this.requiresStorage = false;
};
goog.inherits(os.ui.ProviderImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
os.ui.ProviderImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.FileParserConfig();

  // if an existing config was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }

  var type = opt_config ? opt_config['type'] : file ? file.getType() : null;
  var entry = os.dataManager.getProviderEntry(type);

  if (entry.ui) {
    var provider = opt_config ? opt_config.provider : null;

    if (provider) {
      config['provider'] = provider;
      config['enabled'] = provider.getEnabled();
    } else {
      config['file'] = file;
      config['label'] = file.getFileName();
      config['enabled'] = true;
    }

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': (provider ? provider.getEditable() ? 'Edit ' : 'View ' : 'Add ') + entry.title,
      'icon': 'fa fa-database lt-blue-icon',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '350',
      'max-width': '600',
      'height': 'auto',
      'min-height': '250',
      'max-height': '500',
      'modal': 'true',
      'show-close': 'true',
      'no-scroll': 'true'
    };
    os.ui.window.create(windowOptions, entry.ui, undefined, undefined, undefined, scopeOptions);
  } else {
    // todo log some stuff, man
  }
};
