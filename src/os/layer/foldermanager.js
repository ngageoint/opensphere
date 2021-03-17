goog.module('os.layer.FolderManager');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const Settings = goog.require('os.config.Settings');
const MapContainer = goog.require('os.MapContainer');
const {FolderEventType, SettingsKey} = goog.require('os.layer.folder');
const {remove} = goog.require('goog.array');


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
     * Map for tracking existing layers and folders.
     * @type {Array<osx.layer.FolderOptions>}
     * @protected
     */
    this.items = [];

    MapContainer.getInstance().listen(os.events.LayerEventType.ADD, this.mergeFromMap_, false, this);

    this.restore();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    MapContainer.getInstance().unlisten(os.events.LayerEventType.ADD, this.mergeFromMap_, false, this);
  }

  /**
   * Merges in any new layers from the map.
   * @private
   */
  mergeFromMap_() {
    const layers = MapContainer.getInstance().getLayers();

    for (let j = 0, m = layers.length; j < m; j++) {
      const layer = /** @type {os.layer.ILayer} */ (layers[j]);
      const found = this.getItem(layer.getId());

      if (!found) {
        this.items.push(/** @type {osx.layer.FolderOptions} */ ({
          id: layer.getId(),
          type: 'layer',
          parentId: ''
        }));
      }
    }
  }

  /**
   * Create a new folder.
   * @param {osx.layer.FolderOptions} options The folder options
   */
  createFolder(options) {
    const parentFolder = this.getItem(options.parentId);
    if (parentFolder) {
      parentFolder.children.push(options);
    } else {
      this.items.push(options);
    }

    options.children.forEach((child) => {
      const children = parentFolder ? parentFolder.children : this.items;
      if (children) {
        remove(children, child);
      }

      child.parentId = options.id;
    });

    this.mergeFromMap_();
    this.dispatchEvent(FolderEventType.FOLDER_CREATED);
    this.persist();
  }

  /**
   * Remove a folder.
   * @param {string} id The folder ID to remove
   */
  removeFolder(id) {
    const folder = this.getItem(id);
    let removed = false;

    if (folder) {
      // check if it has a parent, if so, remove it from there
      const parent = this.getItem(folder.parentId);
      if (parent) {
        const children = parent.children;
        if (children) {
          removed = remove(children, folder);

          if (folder.children) {
            parent.children.push(...folder.children);
          }
        }
      } else {
        removed = remove(this.items, folder);
      }
    }

    if (removed) {
      this.mergeFromMap_();
      this.dispatchEvent(FolderEventType.FOLDER_REMOVED);
      this.persist();
    }
  }

  /**
   * Gets the folders.
   * @return {Array<osx.layer.FolderOptions>}
   */
  getItems() {
    return this.items;
  }

  /**
   * Gets a folder or layer item.
   * @param {?string} id The folder ID to find.
   * @return {osx.layer.FolderOptions}
   */
  getItem(id) {
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

    this.items.forEach(finder);

    return folder;
  }

  /**
   * Moves an item before or after another item. This handles reparenting and ordering.
   * @param {string} id
   * @param {string} otherId
   * @param {boolean=} opt_after True if id comes after otherId, False for id before otherId. Defaults to false
   */
  move(id, otherId, opt_after) {
    if (id === otherId) {
      return;
    }

    const otherItem = this.getItem(otherId);
    const otherParent = this.getItem(otherItem.parentId);
    const list = otherParent ? otherParent.children : this.items;

    let index = -1;
    let otherIndex = -1;

    for (let i = 0, n = list.length; i < n; i++) {
      if (list[i].id == id) {
        index = i;
      }

      if (list[i].id == otherId) {
        otherIndex = i;
      }

      if (index > -1 && otherIndex > -1) {
        const item = list.splice(index, 1)[0];

        if (index < otherIndex) {
          otherIndex--;
        }

        list.splice(otherIndex + (opt_after ? 1 : 0), 0, item);
        break;
      }
    }
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
    const existing = this.getItem(options.id);
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
   * Clears the manager.
   */
  clear() {
    this.items = [];
    this.dispatchEvent(FolderEventType.FOLDERS_CLEARED);
  }

  /**
   * Saves the folders to settings.
   * @protected
   */
  persist() {
    Settings.getInstance().set(SettingsKey.FOLDERS, this.items);
  }

  /**
   * Restores the settings.
   * @protected
   */
  restore() {
    this.items = /** @type {Array<osx.layer.FolderOptions>} */ (Settings.getInstance().get(SettingsKey.FOLDERS, []));
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
