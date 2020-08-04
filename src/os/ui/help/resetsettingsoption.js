goog.module('os.ui.help.resetSettingsOption');
goog.module.declareLegacyNamespace();

goog.require('os.ui.util.ResetSettings');
const EventType = goog.require('os.ui.EventType');
const Help = goog.require('os.ui.help');


/**
 * Add the Reset Settings option
 */
const addToNav = function() {
  var menu = Help.MENU;
  menu.getRoot().addChild(resetSettingsOptions);
  menu.listen(EventType.DISPLAY_CLEAR_LOCALSTORAGE, function() {
    os.ui.util.resetSettings();
  });
};


/**
 * Action for clearing local storage. Should be added to help action managers.
 * @type {!os.ui.menu.MenuItemOptions}
 */
const resetSettingsOptions = {
  eventType: EventType.DISPLAY_CLEAR_LOCALSTORAGE,
  label: 'Reset Settings',
  tooltip: 'Clears your browser\'s local storage',
  icons: ['<i class="fa fa-fw fa-refresh"></i>'],
  sort: 1000
};

exports = {addToNav, resetSettingsOptions};
