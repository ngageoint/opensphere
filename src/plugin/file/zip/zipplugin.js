goog.declareModuleId('plugin.file.zip.ZIPPlugin');

import ZIPImportUI from './ui/zipimportui.js';
import ZIPParser from './zipparser.js';

const zip = goog.require('os.file.mime.zip');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');

/**
 * Provides ZIP support
 */
export default class ZIPPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ZIPPlugin.ID;
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
 * @const
 */
ZIPPlugin.ID = 'zip';
