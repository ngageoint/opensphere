goog.module('os.ui.im.FileImportUI');

const {getTypeChain} = goog.require('os.file.mime');
const {TYPE} = goog.require('os.file.mime.text');
const AbstractImportUI = goog.require('os.ui.im.AbstractImportUI');


/**
 * @extends {AbstractImportUI<T>}
 * @template T
 */
class FileImportUI extends AbstractImportUI {
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

exports = FileImportUI;
