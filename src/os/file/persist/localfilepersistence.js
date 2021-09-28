goog.declareModuleId('os.file.persist.LocalFilePersistence');

import FilePersistence from './filepersistence.js';
import {SAVE_COMPLETE, SAVE_FAILED, saveLocal} from './persist.js';

const {default: IPersistenceMethod} = goog.requireType('os.ex.IPersistenceMethod');


/**
 * Persistence method to save local files.
 *
 * @implements {IPersistenceMethod}
 */
export default class LocalFilePersistence extends FilePersistence {
  /**
   * Constructor.
   * @param {string=} opt_dbStore
   */
  constructor(opt_dbStore) {
    super();

    /**
     * @type {string|undefined}
     */
    this.dbstore = opt_dbStore;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'Local';
  }

  /**
   * @inheritDoc
   */
  save(name, content, opt_mimeType, opt_title, opt_descr, opt_tags) {
    return saveLocal(name, content, opt_mimeType, this.dbstore);
  }
}

/**
 * local file event
 * @type {string}
 * @const
 * @deprecated Please use os.file.persist.SAVE_COMPLETE instead.
 */
LocalFilePersistence.SAVE_COMPLETE = SAVE_COMPLETE;

/**
 * local file event
 * @type {string}
 * @const
 * @deprecated Please use os.file.persist.SAVE_FAILED instead.
 */
LocalFilePersistence.SAVE_FAILED = SAVE_FAILED;
