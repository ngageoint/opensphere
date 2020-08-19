goog.provide('os.ui.util.ResetSettings');

goog.require('os.config.Settings');
goog.require('os.storage');
goog.require('os.ui.EventType');
goog.require('os.ui.action.Action');
goog.require('os.ui.window');
goog.require('os.ui.window.ConfirmUI');


/**
 * Launches the clear local storage window
 *
 * @param {string=} opt_parent Optional parent selector.
 */
os.ui.util.resetSettings = function(opt_parent) {
  if (os.config.Settings.getInstance().getPeerInfo(os.config.appNs).length) {
    os.ui.window.ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      'prompt': 'In order to Reset Settings, ' +
      'you may not have the same application opened multiple times.  Please close all but one, and retry.',
      'yesText': 'Ok',
      'noText': '',
      'windowOptions': {
        'id': 'resetDisabled',
        'label': 'Reset Disabled',
        'icon': 'fa fa-refresh',
        'width': '400',
        'height': 'auto',
        'no-scroll': true,
        'modal': true,
        'headerClass': 'bg-danger u-bg-danger-text'
      }
    }));
  } else {
    var windowOptions = {
      'label': 'Reset Settings',
      'icon': 'fa fa-refresh',
      'x': 'center',
      'y': 300,
      'width': 400,
      'height': 'auto',
      'modal': true,
      'no-scroll': true,
      'disable-drag': true,
      'headerClass': 'bg-danger u-bg-danger-text'
    };
    if (opt_parent) {
      windowOptions['window-container'] = opt_parent;
    }

    var text = 'This action will clear all locally saved application settings and <b>reload the current page.</b> ';
    text += 'The current state of your application will be lost, so be sure you\'re at a good stopping point.<br>';
    text += '<br>Last reset: ' + os.config.Settings.getInstance().getLastReset();
    text += '<br><br><b>Are you sure you want to clear your settings and reload?</b>';

    os.ui.window.ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: os.storage.clearStorage,
      prompt: text,
      yesText: 'Clear and Reload',
      yesButtonClass: 'btn-danger',
      windowOptions: windowOptions
    }));
  }
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
