goog.module('os.menu.folder');
goog.module.declareLegacyNamespace();

const FolderManager = goog.require('os.layer.FolderManager');
const FolderNode = goog.require('os.data.FolderNode');
const layerMenu = goog.require('os.ui.menu.layer');
const {FolderEventType, launchRemoveFolder, getFolderMenuEnabled} = goog.require('os.layer.folder');
const {getLayersFromContext} = goog.require('os.ui.menu.layer');
const {getRandomString} = goog.require('goog.string');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItem = goog.requireType('os.ui.menu.MenuItem');
const {Context} = goog.requireType('os.ui.menu.layer');


/**
 * Whether the folder menu has been initialized.
 * @type {boolean}
 */
let initialized = false;


/**
 * Creates a folder.
 * @param {MenuEvent<Context>} event
 */
const createFolder = function(event) {
  const nodes = event.getContext();
  const layers = getLayersFromContext(nodes);
  const fm = FolderManager.getInstance();
  let parentId = '';
  let layerOptions = [];

  if (layers) {
    let parentItems = fm.getParent(layers[0].getId());
    parentItems = Array.isArray(parentItems) ? parentItems : parentItems.children;

    // the order of the layers returned from the context depends on the selection order
    // we want the order to match the view, so sort against the map
    layers.sort((layerA, layerB) => {
      const indexA = parentItems.findIndex((item) => item.id === layerA.getId());
      const indexB = parentItems.findIndex((item) => item.id === layerB.getId());

      return indexA - indexB;
    });
    layerOptions = layers.map((l) => fm.getItem(l.getId()));

    // determine if we need to assign them to a parent
    const parent = nodes[0].getParent();
    if (parent) {
      parentId = parent.getId();
    }

    fm.createOrEditFolder({
      id: getRandomString(),
      type: 'folder',
      children: layerOptions,
      name: 'New Folder',
      parentId: parentId,
      collapsed: false
    });
  }
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

  if (getFolderMenuEnabled() && context && context.length > 0) {
    var layers = layerMenu.getLayersFromContext(context);
    this.visible = layers.length == context.length;
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
  const menu = layerMenu.MENU;

  if (!initialized && menu) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.LAYER);
    initialized = true;

    group.addChild({
      label: 'Create Folder',
      eventType: FolderEventType.CREATE_FOLDER,
      tooltip: 'Creates a folder for layers.',
      icons: ['<i class="fa fa-fw fa-folder"></i>'],
      metricKey: 'os.layer.createFolder',
      beforeRender: showCreateFolder,
      handler: createFolder,
      sort: 0
    });

    group.addChild({
      label: 'Unfolder',
      eventType: FolderEventType.UNFOLDER,
      tooltip: 'Unfolder the layers.',
      icons: ['<i class="fa fa-fw fa-folder"></i>'],
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
