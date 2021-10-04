goog.declareModuleId('os.ui.help');

import * as dispatcher from '../../dispatcher.js';
import UIEvent from '../events/uievent.js';
import UIEventType from '../events/uieventtype.js';
import Menu from '../menu/menu.js';
import MenuItem from '../menu/menuitem.js';
import MenuItemType from '../menu/menuitemtype.js';
import {openWindow} from '../menu/windowsmenu.js';

const Logger = goog.requireType('goog.log.Logger');


/**
 * Application help menu.
 * @type {Menu<undefined>}
 */
export const MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: []
}));

/**
 * @param {string} flag
 */
export const showWindow = function(flag) {
  if (flag && !openWindow(flag)) {
    var evt = new UIEvent(UIEventType.TOGGLE_UI, flag);
    dispatcher.getInstance().dispatchEvent(evt);
  }
};
