goog.declareModuleId('os.ui.menu.save');

import {Map as MapKey} from '../../metrics/metricskeys.js';
import StateManager from '../../state/statemanager.js';
import {EventType} from '../state/statemenu.js';
import Menu from './menu.js';
import MenuItem from './menuitem.js';
import MenuItemType from './menuitemtype.js';

const googDispose = goog.require('goog.dispose');


/**
 * Application save menu.
 * @type {(Menu<undefined>|undefined)}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu<undefined>|undefined}
 */
export const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu<undefined>|undefined} menu The menu.
 */
export const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Set up the menu.
 */
export const setup = function() {
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
export const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Save the application state.
 */
export const onSaveState = function() {
  StateManager.getInstance().startExport();
};
