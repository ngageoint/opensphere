goog.provide('os.ui.util.ResetSettings');

goog.require('os.config.Settings');
goog.require('os.storage');
goog.require('os.ui.EventType');
goog.require('os.ui.action.Action');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');


/**
 * Launches the clear local storage window
 * @param {string=} opt_parent Optional parent selector.
 */
os.ui.util.resetSettings = function(opt_parent) {
  var scopeOptions = {
    'confirmCallback': os.storage.clearStorage,
    'cancelCallback': goog.nullFunction,
    'yesText': 'Clear and Reload',
    'yesIcon': 'fa fa-refresh',
    'noText': 'Cancel',
    'noIcon': 'fa fa-times',
    'yesButtonClass': 'btn-danger'
  };

  var windowOptions = {
    'label': 'Reset Settings',
    'icon': 'fa fa-refresh red-icon',
    'x': 'center',
    'y': 300,
    'width': 350,
    'height': 260,
    'modal': true,
    'no-scroll': true,
    'disable-drag': true
  };
  if (opt_parent) {
    windowOptions['window-container'] = opt_parent;
  }

  var text = 'This action will clear all locally saved application settings and <b>reload the current page.</b> ';
  text += 'The current state of your application will be lost, so be sure you\'re at a good stopping point.<br>';
  text += '<br>Last reset: ' + os.config.Settings.getInstance().getLastReset();
  text += '<br><br><b>Are you sure you want to clear your settings and reload?</b>';
  var template = '<confirm>' + text + '</confirm>';
  os.ui.window.create(windowOptions, template, opt_parent, undefined, undefined, scopeOptions);
};


/**
 * Action for clearing local storage. Should be added to help action managers.
 * @type {!os.ui.menu.MenuItemOptions}
 */
os.ui.util.resetSettingsOptions = {
  eventType: os.ui.EventType.DISPLAY_CLEAR_LOCALSTORAGE,
  label: 'Reset Settings',
  tooltip: 'Clears your browser\'s local storage',
  icons: ['<i class="fa fa-fw fa-refresh"></i>'],
  sort: 1000
};
