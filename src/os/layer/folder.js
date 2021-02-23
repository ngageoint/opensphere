goog.module('os.layer.folder');
goog.module.declareLegacyNamespace();


/**
 * Enum of folder event types.
 * @enum {string}
 */
const FolderEventType = {
  // menu events
  CREATE_FOLDER: 'createFolder',
  REMOVE_FOLDER: 'removeFolder',

  // manager events
  FOLDER_CREATED: 'folderCreated',
  FOLDER_UPDATED: 'folderUpdated',
  FOLDER_REMOVED: 'folderRemoved',
  FOLDERS_CLEARED: 'foldersCleared'
};


/**
 * Enum of folder settings keys.
 * @enum {string}
 */
const SettingsKey = {
  FOLDERS: 'layers.folders'
};


exports = {
  FolderEventType,
  SettingsKey
};
