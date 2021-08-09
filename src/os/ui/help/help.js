goog.module('os.ui.help');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventType = goog.require('os.ui.events.UIEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {openWindow} = goog.require('os.ui.menu.windows');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Application help menu.
 * @type {Menu<undefined>}
 */
const MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: []
}));

/**
 * @param {string} flag
 */
const showWindow = function(flag) {
  if (flag && !openWindow(flag)) {
    var evt = new UIEvent(UIEventType.TOGGLE_UI, flag);
    dispatcher.getInstance().dispatchEvent(evt);
  }
};

exports = {
  MENU,
  showWindow
};
