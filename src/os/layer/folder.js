goog.declareModuleId('os.layer.folder');

import * as ConfirmUI from '../ui/window/confirm.js';
import * as ConfirmTextUI from '../ui/window/confirmtext.js';


/**
 * Enum of folder event types.
 * @enum {string}
 */
export const FolderEventType = {
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

export const MetricKey = {
  CREATE_FOLDER: 'os.layer.folder.folderCreated',
  REMOVE_FOLDER: 'os.layer.folder.folderUpdated',
  UNFOLDER: 'os.layer.folder.foldersCleared'
};

/**
 * Enum of folder settings keys.
 * @enum {string}
 */
export const SettingsKey = {
  FOLDERS: 'layers.folders'
};

/**
 * Prompt to display when a new folder is being created.
 * @type {string}
 */
export const CREATE_PROMPT = 'Create a new folder to manually group layers.';

/**
 * Launch the remove folder dialog.
 * @param {osx.layer.FolderOptions} options The folder options.
 * @param {function()} callback Callback to fire when the remove is confirmed.
 * @param {boolean=} opt_removeChildren If child layers should be removed.
 */
export const launchRemoveFolder = (options, callback, opt_removeChildren) => {
  let prompt = 'Are you sure you want to remove the folder?';

  if (opt_removeChildren) {
    prompt += ' This will remove all child layers as well.';
  }

  ConfirmUI.launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
    confirm: callback,
    prompt: prompt,
    yesText: 'Remove',
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fa fa-trash-o',
      label: 'Remove ' + options.name
    })
  }));
};

/**
 * Create or edit a folder.
 * @param {osx.layer.FolderOptions} options The folder options.
 * @param {function(string)} callback Callback when the folder name is confirmed.
 * @param {boolean=} opt_isEdit If an existing folder is being edited.
 */
export const createOrEditFolder = (options, callback, opt_isEdit = false) => {
  const folderName = options.name || 'New Folder';
  const actionText = opt_isEdit ? 'Rename' : 'Add';
  const winLabel = `${actionText} Folder`;

  const prompt = !opt_isEdit ? CREATE_PROMPT : undefined;

  const confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
    confirm: callback,
    defaultValue: folderName,
    prompt,
    subPrompt: 'Please choose a name for the folder.',
    yesText: actionText,
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fa fa-folder',
      label: winLabel
    })
  });

  ConfirmTextUI.launchConfirmText(confirmOptions);
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
export const setFolderMenuEnabled = (value) => {
  folderMenuEnabled = value;
};

/**
 * Get whether the folder menu is abled
 * @return {boolean}
 */
export const getFolderMenuEnabled = () => {
  return folderMenuEnabled;
};
