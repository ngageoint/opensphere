goog.declareModuleId('os.file.persist.FilePersistence');

import IPersistenceMethod from '../../ex/ipersistencemethod.js';// eslint-disable-line
import {saveFile} from './persist.js';


/**
 * Persistence method to save local files.
 *
 * @implements {IPersistenceMethod}
 */
export default class FilePersistence {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'File';
  }

  /**
   * @inheritDoc
   */
  isSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  requiresUserAction() {
    return true;
  }

  /**
   * @inheritDoc
   */
  save(fileName, content, opt_mimeType, opt_title, opt_description, opt_tags) {
    return saveFile(fileName, content, opt_mimeType);
  }
}
