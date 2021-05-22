goog.module('plugin.file.zip.ZIPPlugin');
goog.module.declareLegacyNamespace();

const zip = goog.require('os.file.mime.zip');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const ZIPParser = goog.require('plugin.file.zip.ZIPParser');
const ZIPImportUI = goog.require('plugin.file.zip.ui.ZIPImportUI');


/**
 * Provides ZIP support
 */
class ZIPPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    // register the zip import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('ZIP file (*.ZIP)', true);
    im.registerImportUI(zip.TYPE, new ZIPImportUI());
    im.registerParser(this.id, ZIPParser);
  }
}


/**
 * @type {string}
 */
const ID = 'zip';


exports = ZIPPlugin;
