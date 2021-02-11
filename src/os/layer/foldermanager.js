goog.module('os.layer.FolderManager');
goog.module.declareLegacyNamespace();

const {FolderEventType} = goog.require('os.layer.folder');
const EventTarget = goog.require('goog.events.EventTarget');
const Settings = goog.require('os.config.Settings');


/**
 * Global folder manager instance.
 * @type {FolderManager}
 */
let instance;


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
     * @type {Object<string, osx.layer.FolderOptions>}
     * @protected
     */
    this.folderMap = {};

    this.restore();
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

  /**
   * Create a new folder.
   * @param {osx.layer.FolderOptions} options The folder options
   */
  createFolder(options) {
    if (!options.children) {
      options.children = [];
    }

    if (options.parentId) {
      const parentFolder = this.getFolder(options.parentId);
      if (parentFolder) {
        parentFolder.children.unshift(options);

        if (options.children) {
          options.children.forEach((child) => {
            goog.array.remove(parentFolder.children, child);
          });
        }
      } else {
        this.folderMap[options.id] = options;
      }
    } else {
      this.folderMap[options.id] = options;
    }

    this.dispatchEvent(FolderEventType.FOLDER_CREATED);
    this.persist();
  }

  /**
   * Remove a folder.
   * @param {string} id The folder ID to remove
   */
  removeFolder(id) {
    if (this.folderMap[id]) {
      delete this.folderMap[id];
    } else {
      const folder = this.getFolder(id);
      if (folder) {
        const parent = this.getFolder(folder.parentId);
        goog.array.remove(parent.children, folder);
      }
    }

    this.dispatchEvent(FolderEventType.FOLDER_REMOVED);
    this.persist();
  }

  /**
   * Gets the folder map.
   * @return {Object<string, osx.layer.FolderOptions>}
   */
  getFolders() {
    return this.folderMap;
  }

  /**
   * Gets the folder map.
   * @param {string} id The folder ID to find.
   * @return {Object<string, osx.layer.FolderOptions>}
   */
  getFolder(id) {
    let folder = this.folderMap[id];

    if (!folder) {
      const finder = function(options) {
        if (folder) {
          return;
        }

        if (options.id == id) {
          folder = options;
          return;
        }

        const children = options.children;
        if (children) {
          children.forEach(finder);
        }
      };

      for (const key in this.folderMap) {
        const options = this.folderMap[key];
        options.children.forEach(finder);
      }
    }

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
    // this.dispatchEvent(FolderEventType.FOLDER_CREATED);
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
   * Saves the folders to settings.
   */
  persist() {
    Settings.getInstance().set('layers.folders', this.folderMap);
  }

  /**
   * Restores the settings.
   */
  restore() {
    this.folderMap = /** @type {Object<string, osx.layer.FolderOptions>} */
        (Settings.getInstance().get('layers.folders', {}));
  }
}

exports = FolderManager;
