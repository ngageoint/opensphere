goog.module('os.layer.folder');
goog.module.declareLegacyNamespace();

const ConfirmUI = goog.require('os.ui.window.ConfirmUI');


/**
 * Enum of folder event types.
 * @enum {string}
 */
const FolderEventType = {
  // menu events
  CREATE_FOLDER: 'createFolder',
  REMOVE_FOLDER: 'removeFolder',
  UNFOLDER: 'unfolder',

  // manager events
  FOLDER_CREATED: 'folderCreated',
  FOLDER_UPDATED: 'folderUpdated',
  FOLDER_REMOVED: 'folderRemoved',
  FOLDERS_CLEARED: 'foldersCleared'
};


const MetricKey = {
  CREATE_FOLDER: 'os.layer.folder.folderCreated',
  REMOVE_FOLDER: 'os.layer.folder.folderUpdated',
  UNFOLDER: 'os.layer.folder.foldersCleared'
};


/**
 * Enum of folder settings keys.
 * @enum {string}
 */
const SettingsKey = {
  FOLDERS: 'layers.folders'
};


/**
 * Launches the remove folder dialog
 * @param {osx.layer.FolderOptions} options
 * @param {Function} callback
 * @param {boolean=} opt_removeChildren
 */
const launchRemoveFolder = (options, callback, opt_removeChildren) => {
  let prompt = 'Are you sure you want to remove the folder?';

  if (opt_removeChildren) {
    prompt += ' This will remove all child layers as well.';
  }

  ConfirmUI.launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
    confirm: callback,
    prompt: prompt,
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fa fa-trash-o',
      label: 'Remove ' + options.name
    })
  }));
};


/**
 * Flag for keeping track of whether the folder menu items should appear.
 * @type {boolean}
 */
let folderMenuEnabled = true;


/**
 * Set whether the folder menu is enabled.
 * @param {boolean} value
 */
const setFolderMenuEnabled = (value) => {
  folderMenuEnabled = value;
};


/**
 * Get whether the folder menu is abled
 * @return {boolean}
 */
const getFolderMenuEnabled = () => {
  return folderMenuEnabled;
};


exports = {
  FolderEventType,
  MetricKey,
  SettingsKey,
  launchRemoveFolder,
  setFolderMenuEnabled,
  getFolderMenuEnabled
};
