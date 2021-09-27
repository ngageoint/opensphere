goog.declareModuleId('os.ui.im.FileImportUI');

import AbstractImportUI from './abstractimportui.js';

const {getTypeChain} = goog.require('os.file.mime');
const {TYPE} = goog.require('os.file.mime.text');


/**
 * @extends {AbstractImportUI<T>}
 * @template T
 */
export default class FileImportUI extends AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // default file import to requiring a local storage mechanism
    this.requiresStorage = true;
  }

  /**
   * @inheritDoc
   */
  mergeConfig(from, to) {
    super.mergeConfig(from, to);
    to['descriptor'] = from['descriptor'];
    to['file'] = from['file'];
    to['oldFile'] = from['oldFile'];
    to['replace'] = from['replace'];
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    if (file) {
      var type = file.getType();

      if (type) {
        var chain = getTypeChain(type);
        if (chain && chain.indexOf(TYPE) > -1) {
          file.convertContentToString();
        }
      }
    }
  }
}
