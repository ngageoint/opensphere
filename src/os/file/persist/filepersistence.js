goog.module('os.file.persist.FilePersistence');
goog.module.declareLegacyNamespace();

const IPersistenceMethod = goog.require('os.ex.IPersistenceMethod'); // eslint-disable-line
const {saveFile} = goog.require('os.file.persist');


/**
 * Persistence method to save local files.
 *
 * @implements {IPersistenceMethod}
 */
class FilePersistence {
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

exports = FilePersistence;
