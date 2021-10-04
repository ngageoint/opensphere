goog.declareModuleId('plugin.file.zip.ZIPPlugin');

import * as zip from '../../../os/file/mime/zip.js';
import AbstractPlugin from '../../../os/plugin/abstractplugin.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import ZIPImportUI from './ui/zipimportui.js';
import ZIPParser from './zipparser.js';


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
