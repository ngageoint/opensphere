goog.module('os.layer.FolderManager');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const Settings = goog.require('os.config.Settings');
const ZOrder = goog.require('os.data.ZOrder');
const {FolderEventType, SettingsKey} = goog.require('os.layer.folder');
const {remove} = goog.require('goog.array');


/**
 * Global folder manager instance.
 * @type {FolderManager}
 */
let instance;


/**
 * Sorts options by their current ZOrder state.
 * @param {osx.layer.FolderOptions|string} options The folder options
 */
const sortFromZOrder = (options) => {
  const zOrder = ZOrder.getInstance();
  if (options.children) {
    options.children.sort((a, b) => {
      const aI = zOrder.getIndex(a);
      const bI = zOrder.getIndex(b);
      return bI - aI;
    });
  }
};


/**
 * Manager class for layer folders. Maintains a map of what folders exist and what layers belong to them.
 */
class FolderManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Map for tracking existing folders.
     * @type {Array<osx.layer.FolderOptions>}
     * @protected
     */
    this.folders = [];

    ZOrder.getInstance().listen('zOrder:update', this.updateZOrder, false, this);

    this.restore();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    ZOrder.getInstance().unlisten('zOrder:update', this.updateZOrder, false, this);
  }

  /**
   * Create a new folder.
   * @param {osx.layer.FolderOptions} options The folder options
   */
  createFolder(options) {
    const parentFolder = this.getFolder(options.parentId);
    if (parentFolder) {
      parentFolder.children.push(options);

      options.children.forEach((child) => {
        remove(parentFolder.children, child);
      });
    } else {
      this.folders.push(options);
    }

    this.updateZOrder();
    this.dispatchEvent(FolderEventType.FOLDER_CREATED);
    this.persist();
  }

  /**
   * Remove a folder.
   * @param {string} id The folder ID to remove
   */
  removeFolder(id) {
    const folder = this.getFolder(id);
    let removed = false;

    if (folder) {
      // check if it has a parent, if so, remove it from there
      const parent = this.getFolder(folder.parentId);
      if (parent) {
        removed = remove(parent.children, folder);
      } else {
        removed = remove(this.folders, folder);
      }
    }

    if (removed) {
      this.dispatchEvent(FolderEventType.FOLDER_REMOVED);
      this.persist();
    }
  }

  /**
   * Gets the folder map.
   * @return {Array<osx.layer.FolderOptions>}
   */
  getFolders() {
    return this.folders;
  }

  /**
   * Gets the folder map.
   * @param {?string} id The folder ID to find.
   * @return {osx.layer.FolderOptions}
   */
  getFolder(id) {
    let folder;

    const finder = function(options) {
      if (folder) {
        return;
      }

      if (options.id == id) {
        folder = options;
        return;
      }

      if (options.children) {
        options.children.forEach(finder);
      }
    };

    this.folders.forEach(finder);

    return folder;
  }

  /**
   * Callback for folder name.
   * @param {!osx.layer.FolderOptions} options The folder options.
   * @param {string} name The chosen folder name.
   * @protected
   */
  onFolderName(options, name) {
    this.removeFolder(options.id);
    options.name = name;
    this.createFolder(options);
  }

  /**
   * Create or e edit a folder.
   * @param {osx.layer.FolderOptions} options
   * @param {string=} opt_parentId
   */
  createOrEditFolder(options, opt_parentId) {
    const existing = this.getFolder(options.id);
    const label = existing ? existing.name : 'New Folder';
    const winLabel = (existing ? 'Edit' : 'Add') + ' Folder';

    const confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: this.onFolderName.bind(this, options),
      defaultValue: label,
      prompt: 'Please choose a label for the folder:',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        icon: 'fa fa-folder',
        label: winLabel
      })
    });

    os.ui.window.launchConfirmText(confirmOptions);
  }

  /**
   * Handler for Z-Order update events.
   * @protected
   */
  updateZOrder() {
    const updateSort = (folder) => {
      sortFromZOrder(folder);
      if (folder.children) {
        folder.children.forEach(updateSort);
      }
    };

    // this.folders.sort(sortFromZOrder);
    this.folders.forEach(updateSort);
    this.dispatchEvent(FolderEventType.FOLDER_UPDATED);
  }

  /**
   * Clears the manager.
   */
  clear() {
    this.folders = [];
    this.dispatchEvent(FolderEventType.FOLDERS_CLEARED);
  }

  /**
   * Saves the folders to settings.
   * @protected
   */
  persist() {
    Settings.getInstance().set(SettingsKey.FOLDERS, this.folders);
  }

  /**
   * Restores the settings.
   * @protected
   */
  restore() {
    this.folders = /** @type {Array<osx.layer.FolderOptions>} */ (Settings.getInstance().get(SettingsKey.FOLDERS, []));
  }

  /**
   * Get the global folder manager instance.
   * @return {FolderManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new FolderManager();
    }

    return instance;
  }

  /**
   * Set the global folder manager instance.
   * @param {!FolderManager} value The FolderManager instance to set.
   */
  static setInstance(value) {
    instance = value;
  }
}

exports = FolderManager;
