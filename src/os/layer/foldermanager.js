goog.module('os.layer.FolderManager');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const Settings = goog.require('os.config.Settings');
const MapContainer = goog.require('os.MapContainer');
const {FolderEventType, SettingsKey} = goog.require('os.layer.folder');
const {remove} = goog.require('goog.array');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Global folder manager instance.
 * @type {FolderManager}
 */
let instance;


/**
 * Logger for the manager.
 * @type {Logger}
 */
const logger = log.getLogger('os.layer.FolderManager');


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

    MapContainer.getInstance().listen(os.events.LayerEventType.ADD, this.mergeFromMap, false, this);

    this.restore();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    MapContainer.getInstance().unlisten(os.events.LayerEventType.ADD, this.mergeFromMap, false, this);
  }

  /**
   * Merges in any new layers from the map.
   * @protected
   */
  mergeFromMap() {
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
    if (this.getItem(options.id)) {
      // don't allow creation of a duplicate folder ID
      log.warning(logger, `Skipping folder creation with duplicate ID: ${options.id}.
          Details: ${JSON.stringify(options)}`);
      return;
    }

    const parentFolder = this.getItem(options.parentId);
    let index;

    if (parentFolder) {
      index = parentFolder.children.indexOf(options.children[0]);
      if (index > -1) {
        parentFolder.children.splice(1, 0, options);
      } else {
        parentFolder.children.push(options);
      }
    } else {
      index = this.items.indexOf(options.children[0]);
      if (index > -1) {
        this.items.splice(index, 0, options);
      } else {
        this.items.push(options);
      }
    }

    options.children.forEach((child) => {
      const children = parentFolder ? parentFolder.children : this.items;
      if (children) {
        remove(children, child);
      }

      child.parentId = options.id;
    });

    this.mergeFromMap();
    this.dispatchEvent(FolderEventType.FOLDER_CREATED);
    this.persist();
  }

  /**
   * Remove a folder.
   * @param {string} id The folder ID to remove
   */
  removeFolder(id) {
    const folder = this.getItem(id);

    if (folder) {
      // check if it has a parent, if so, remove it from there
      const parent = this.getItem(folder.parentId);
      const array = parent ? parent.children : this.items;
      const currentIndex = array.indexOf(folder);

      // remove the folder, and insert any children it has where it in its containing array
      folder.children.forEach((child) => child.parentId = parent ? parent.id : '');
      array.splice(currentIndex, 1, ...folder.children);

      // update from the map and notify listeners
      this.mergeFromMap();
      this.dispatchEvent(FolderEventType.FOLDER_REMOVED);
      this.persist();
    }
  }

  /**
   * Gets the foldered items.
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
   * Gets the parent folder to an item.
   * @param {?string} id The folder ID to find.
   * @return {?(osx.layer.FolderOptions|Array<osx.layer.FolderOptions>)}
   */
  getParent(id) {
    const item = this.getItem(id);
    let parent = null;

    if (item) {
      parent = this.getItem(item.parentId) || this.items;
    }

    return parent;
  }

  /**
   * Moves an item before or after another item. This handles reparenting and ordering.
   * @param {string} id The ID of the item to move.
   * @param {string} targetId The ID of the target item.
   * @param {boolean=} opt_after True if the item should be moved after the target item.
   * @param {boolean=} opt_sibling True for the case of dropping a node above a target folder.
   */
  move(id, targetId, opt_after = false, opt_sibling = false) {
    if (id === targetId) {
      return;
    }

    // find the item we're moving and the list it's in
    const item = this.getItem(id);

    // find the target item and a) its children if it's a folder or b) the array it is in
    const targetItem = this.getItem(targetId);

    if (item && targetItem) {
      const itemParent = this.getItem(item.parentId);
      const list = itemParent && itemParent.type == 'folder' ? itemParent.children : this.items;
      const index = list.indexOf(item);

      let targetParent;
      let targetList;
      let targetIndex;

      if (targetItem && targetItem.type === 'folder') {
        if (opt_sibling) {
          targetParent = this.getItem(targetItem.parentId);
          targetList = targetParent ? targetParent.children : this.items;
          targetIndex = targetList.indexOf(targetItem);
        } else {
          // dropped directly on a folder, so use its children and put the item in the 0th position
          targetParent = targetItem;
          targetList = targetItem.children;
          targetIndex = 0;
        }
      } else {
        // locate the correct parent list and target index
        targetParent = this.getItem(targetItem.parentId);
        targetList = targetParent && targetParent.type == 'folder' ? targetParent.children : this.items;
        targetIndex = targetList.indexOf(targetItem);
      }

      if (index > -1 && targetIndex > -1) {
        list.splice(index, 1);
        item.parentId = targetParent ? targetParent.id : '';

        if (list === targetList && index < targetIndex) {
          // shift the target index back by one if the item was removed from in front of the target
          targetIndex--;
        }

        targetList.splice(targetIndex + (opt_after ? 1 : 0), 0, item);
      }
    } else {
      log.warning(logger, `Failed to move item with ID: ${id} to target item with ID: ${targetId}.`);
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
   */
  persist() {
    Settings.getInstance().set(SettingsKey.FOLDERS, this.items);
  }

  /**
   * Restores the settings.
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
