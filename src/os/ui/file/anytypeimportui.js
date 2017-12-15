goog.provide('os.ui.file.AnyTypeImportUI');
goog.require('os.ui.file.anyTypeImportDirective');
goog.require('os.ui.im.AbstractImportUI');
goog.require('os.ui.im.ImportManager');



/**
 * @extends {os.ui.im.AbstractImportUI.<T>}
 * @constructor
 * @template T
 */
os.ui.file.AnyTypeImportUI = function() {
  os.ui.file.AnyTypeImportUI.base(this, 'constructor');
};
goog.inherits(os.ui.file.AnyTypeImportUI, os.ui.im.AbstractImportUI);


/**
 * @inheritDoc
 */
os.ui.file.AnyTypeImportUI.prototype.launchUI = function(file, opt_config) {
  var importers = os.ui.im.ImportManager.getInstance().getImporters();
  var visibleImporters = [];
  goog.array.forEach(importers, function(importor) {
    if (importor.getTitle()) {
      importor['title'] = importor.getTitle();
      visibleImporters.push(importor);
    }
  });

  goog.array.sort(visibleImporters, function(a, b) {
    return a.getTitle() > b.getTitle() ? 1 : 0;
  });

  if (visibleImporters.length > 0) {
    var scopeOptions = {
      'importers': visibleImporters,
      'file': file,
      'config': opt_config
    };
    var windowOptions = {
      'label': 'Choose Import Method',
      'icon': 'fa fa-cloud-download',
      'x': 'center',
      'y': 'center',
      'width': '450',
      'min-width': '350',
      'max-width': '600',
      'height': 'auto',
      'show-close': 'true',
      'no-scroll': 'true'
    };
    os.ui.window.create(windowOptions, 'anytypeimport', undefined, undefined, undefined, scopeOptions);
  } else {
    throw new Error('No Importers to select from');
  }
};
