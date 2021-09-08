goog.module('os.ui.menu.windows');

const googDispose = goog.require('goog.dispose');
const SettingsManager = goog.require('os.ui.config.SettingsManager');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const GroupType = goog.require('os.ui.menu.windows.GroupType');
const osWindow = goog.require('os.ui.window');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');


/**
 * The windows menu.
 * @type {Menu|undefined}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu|undefined}
 */
const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu|undefined} menu The menu.
 */
const setMenu = (menu) => {
  MENU = menu;
};

/**
 * @type {Object<string, Function|Object<string, string>>}
 */
const configs_ = {};

/**
 * Map of window ids to their alias.
 * @type {!Object<string, string>}
 */
const aliases_ = {};

/**
 * @param {string} id The window id
 * @param {Object<string, string>} config The window config to pass to os.ui.window.create
 * @param {boolean=} opt_isMajor If the window should be put in the major group. Defaults to false.
 * @param {Function=} opt_func Configuration function to create the window.
 * @param {string=} opt_alias The id of the opened window, if different from `id`.
 * @return {MenuItem|undefined}
 */
const addWindow = function(id, config, opt_isMajor, opt_func, opt_alias) {
  // If theres no menu or this menu is already added
  if (!MENU || configs_[id]) {
    return;
  }

  config['id'] = id;
  configs_[id] = opt_func || config;

  var menuItem;
  var eventType = 'openWindow.' + id;
  var groupType = opt_isMajor ? GroupType.MAJOR : GroupType.MINOR;
  var group = MENU.getRoot().find(groupType);
  if (group) {
    menuItem = group.addChild({
      label: config['label'],
      eventType: eventType,
      tooltip: config['description'] || '',
      icons: ['<i class="fa fa-fw ' + config['icon'] + '"></i>'],
      shortcut: config['shortcut'],
      metricKey: config['metricKey'],
      handler: openWindow
    });
  }

  if (opt_alias) {
    aliases_[id] = opt_alias;
  }

  // don't need this any more
  delete config['shortcut'];

  // see if this window should be open initially
  return menuItem;
};

/**
 * Set up the windows menu.
 */
const setup = function() {
  if (!MENU) {
    MENU = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: '',
        eventType: GroupType.MAJOR,
        type: MenuItemType.GROUP,
        sort: 0
      }, {
        label: '',
        eventType: GroupType.MINOR,
        type: MenuItemType.GROUP,
        sort: 1
      }]
    }));
  }
};

/**
 * Dispose the windows menu.
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Open a window.
 *
 * @param {string|MenuEvent} evt The menu event.
 * @return {boolean} If the open was successful.
 */
const openWindow = function(evt) {
  var id = typeof evt === 'string' ? evt : evt.type.split(/\./)[1];

  if (osWindow.exists(id)) {
    osWindow.bringToFront(id);
    return true;
  } else {
    var config = configs_[id];

    if (config) {
      if (typeof config === 'function') {
        config();
      } else {
        config = Object.assign({}, config);
        var html = config['html'];
        delete config['html'];
        osWindow.create(config, html);
      }

      return true;
    }
  }

  return false;
};

/**
 * Toggle a window.
 *
 * @param {string} id The window id.
 * @return {boolean} If the toggle was successful.
 */
const toggleWindow = function(id) {
  var win = osWindow.getById(id);

  if (!win) {
    // not found, check if it has an alias
    var alias = aliases_[id];
    if (alias) {
      win = osWindow.getById(alias);
    }
  }

  if (win) {
    osWindow.close(win);
    return true;
  }

  return openWindow(id);
};

/**
 * Opens settings with a specific plugin selected
 *
 * @param {string} id
 */
const openSettingsTo = function(id) {
  SettingsManager.getInstance().setSelectedPlugin(id);
  openWindow('settings');
};

exports = {
  getMenu,
  setMenu,
  addWindow,
  setup,
  dispose,
  openWindow,
  toggleWindow,
  openSettingsTo
};
