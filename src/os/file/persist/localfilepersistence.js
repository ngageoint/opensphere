goog.module('os.file.persist.LocalFilePersistence');

const {SAVE_COMPLETE, SAVE_FAILED, saveLocal} = goog.require('os.file.persist');
const FilePersistence = goog.require('os.file.persist.FilePersistence');

const IPersistenceMethod = goog.requireType('os.ex.IPersistenceMethod');


/**
 * Persistence method to save local files.
 *
 * @implements {IPersistenceMethod}
 */
class LocalFilePersistence extends FilePersistence {
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

exports = LocalFilePersistence;
