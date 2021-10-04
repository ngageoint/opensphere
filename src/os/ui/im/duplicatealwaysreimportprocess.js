goog.declareModuleId('os.ui.im.DuplicateAlwaysReimportProcess');

import ImportProcess from './importprocess.js';


/**
 * Extension of the {@code os.ui.im.DuplcateImportProcess} to always choose the option to reimport.
 */
export default class DuplicateAlwaysReimportProcess extends ImportProcess {
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
