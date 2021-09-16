goog.module('os.ui.file.AnyTypeImportUI');

const {directiveTag: importUi} = goog.require('os.ui.file.AnyTypeImport');
const AbstractImportUI = goog.require('os.ui.im.AbstractImportUI');
const ImportManager = goog.require('os.ui.im.ImportManager');
const osWindow = goog.require('os.ui.window');


/**
 * @extends {AbstractImportUI<T>}
 * @template T
 */
class AnyTypeImportUI extends AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    var importers = ImportManager.getInstance().getImporters();
    var visibleImporters = [];
    importers.forEach(function(importor) {
      if (importor.getTitle()) {
        visibleImporters.push(importor);
      }
    });

    visibleImporters.sort(function(a, b) {
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
        'height': 'auto',
        'show-close': 'true'
      };
      osWindow.create(windowOptions, importUi, undefined, undefined, undefined, scopeOptions);
    } else {
      throw new Error('No Importers to select from');
    }
  }
}

exports = AnyTypeImportUI;
