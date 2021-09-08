goog.module('os.ui.im.DuplicateAlwaysReimportProcess');

const ImportProcess = goog.require('os.ui.im.ImportProcess');


/**
 * Extension of the {@code os.ui.im.DuplcateImportProcess} to always choose the option to reimport.
 */
class DuplicateAlwaysReimportProcess extends ImportProcess {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Override parent to always reimport
   *
   * @inheritDoc
   */
  onFileExists() {
    this.importFile();
  }

  /**
   * Override parent to always reimport
   *
   * @inheritDoc
   */
  onUrlExists() {
    this.importFile();
  }
}

exports = DuplicateAlwaysReimportProcess;
