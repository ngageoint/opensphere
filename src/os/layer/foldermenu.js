goog.module('os.menu.folder');

const FolderManager = goog.require('os.layer.FolderManager');
const FolderNode = goog.require('os.data.FolderNode');
const layerMenu = goog.require('os.ui.menu.layer');
const {filterFalsey} = goog.require('os.fn');
const {FolderEventType, launchRemoveFolder, createOrEditFolder, getFolderMenuEnabled} = goog.require('os.layer.folder');
const {getRandomString} = goog.require('goog.string');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');
const {Context} = goog.requireType('os.ui.menu.layer');


/**
 * Whether the folder menu has been initialized.
 * @type {boolean}
 */
let initialized = false;


/**
 * Gets the folder items from the context.
 * @param {Context} nodes
 * @return {!Array<!osx.layer.FolderOptions>}
 */
const getItemsFromContext = (nodes) => {
  const fm = FolderManager.getInstance();
  let options;

  if (nodes && nodes.length > 0) {
    // don't allow creating a folder with nodes that live at different depths
    const depth = nodes[0].depth;
    const sameDepth = nodes.every((node) => node.depth === depth);
    if (sameDepth) {
      options = nodes.map((node) => fm.getItem(node.getId())).filter(filterFalsey);
    }
  }

  return options || [];
};


/**
 * Creates a folder.
 * @param {MenuEvent<Context>} event
 */
const createFolder = function(event) {
  const nodes = event.getContext();
  const items = getItemsFromContext(nodes);
  const fm = FolderManager.getInstance();
  let parentId = '';

  if (items && items.length > 0) {
    let parentItems = fm.getParent(items[0].id);
    parentItems = Array.isArray(parentItems) ? parentItems : parentItems.children;

    // the order of the layers returned from the context depends on the selection order
    // we want the order to match the view, so sort against the map
    items.sort((itemA, itemB) => {
      const indexA = parentItems.findIndex((item) => item.id === itemA.id);
      const indexB = parentItems.findIndex((item) => item.id === itemB.id);
      return indexA - indexB;
    });

    // determine if we need to assign them to a parent
    const parent = nodes[0].getParent();
    if (parent) {
      parentId = parent.getId();
    }
  }

  const createOptions = {
    id: getRandomString(),
    type: 'folder',
    children: items,
    name: 'New Folder',
    parentId: parentId,
    collapsed: false
  };

  createOrEditFolder(createOptions, onCreateFolder.bind(undefined, createOptions));
};


/**
 * Handle creating a folder.
 * @param {osx.layer.FolderOptions} createOptions The ID to remove.
 * @param {string} name The chosen folder name.
 * @protected
 */
const onCreateFolder = (createOptions, name) => {
  createOptions.name = name;
  FolderManager.getInstance().createFolder(createOptions);
};


/**
 * Removes a folder.
 * @param {MenuEvent<Context>} event
 */
const unfolder = function(event) {
  const context = event.getContext()[0];

  if (context instanceof FolderNode) {
    launchRemoveFolder(context.getOptions(), onUnfolder.bind(undefined, context.getId()));
  }
};


/**
 * Handle unfoldering a folder.
 * @param {!string} id The ID to remove.
 * @protected
 */
const onUnfolder = (id) => {
  FolderManager.getInstance().removeFolder(id);
};


/**
 * Show a menu item if the context supports creating a folder.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const showCreateFolder = function(context) {
  this.visible = false;

  const items = getItemsFromContext(context);
  if (items && items.length > 0 || context.length == 0) {
    this.visible = getFolderMenuEnabled();
  }
};


/**
 * Show a menu item if the context supports unfoldering.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const showUnfolder = function(context) {
  this.visible = false;

  if (getFolderMenuEnabled() && context && context.length == 1) {
    this.visible = context[0] instanceof FolderNode;
  }
};


/**
 * Sets up analyze actions
 */
const setup = function() {
  layerMenu.setup();
  const menu = layerMenu.getMenu();

  if (!initialized && menu) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.LAYER);
    initialized = true;

    group.addChild({
      label: 'Create Folder',
      eventType: FolderEventType.CREATE_FOLDER,
      tooltip: 'Creates a folder for layers.',
      icons: ['<i class="fa fa-fw fa-folder-plus"></i>'],
      metricKey: 'os.layer.createFolder',
      beforeRender: showCreateFolder,
      handler: createFolder,
      sort: 0
    });

    group.addChild({
      label: 'Unfolder',
      eventType: FolderEventType.UNFOLDER,
      tooltip: 'Unfolder the layers.',
      icons: ['<i class="fa fa-fw fa-folder-minus"></i>'],
      metricKey: 'os.layer.unfolder',
      beforeRender: showUnfolder,
      handler: unfolder,
      sort: 10
    });
  }
};


exports = {
  setup
};
