goog.module('os.ui.menu.save');

const googDispose = goog.require('goog.dispose');
const {Map: MapKey} = goog.require('os.metrics.keys');
const StateManager = goog.require('os.state.StateManager');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {EventType} = goog.require('os.ui.state.menu');


/**
 * Application save menu.
 * @type {(Menu<undefined>|undefined)}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu<undefined>|undefined}
 */
const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu<undefined>|undefined} menu The menu.
 */
const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Set up the menu.
 */
const setup = function() {
  if (!MENU) {
    MENU = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: 'State',
        eventType: EventType.SAVE_STATE,
        tooltip: 'Save the application state',
        icons: ['<i class="fa fa-fw fa-bookmark"></i>'],
        handler: onSaveState,
        metricKey: MapKey.SAVE_STATE,
        shortcut: 'Ctrl+S',
        sort: 10
      }]
    }));
  }
};

/**
 * Disposes layer actions
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Save the application state.
 */
const onSaveState = function() {
  StateManager.getInstance().startExport();
};

exports = {
  getMenu,
  setMenu,
  setup,
  dispose,
  onSaveState
};
