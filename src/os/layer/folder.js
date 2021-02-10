goog.module('os.layer.folder');
goog.module.declareLegacyNamespace();


/**
 * Enum of folder event types.
 * @enum {string}
 */
const FolderEventType = {
  CREATE_FOLDER: 'createFolder',
  REMOVE_FOLDER: 'removeFolder',
  FOLDER_CREATED: 'folderCreated',
  FOLDER_UPDATED: 'folderUpdated',
  FOLDER_REMOVED: 'folderRemoved'
};


exports = {
  FolderEventType
};
