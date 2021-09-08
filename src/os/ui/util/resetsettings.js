goog.module('os.ui.util.ResetSettings');

const osConfig = goog.require('os.config');
const {getSettings} = goog.require('os.config.instance');
const {clearStorage} = goog.require('os.storage');
const EventType = goog.require('os.ui.EventType');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const MenuItemOptions = goog.requireType('os.ui.menu.MenuItemOptions');


/**
 * Launches the clear local storage window
 * @param {string=} opt_parent Optional parent selector.
 */
const resetSettings = function(opt_parent) {
  const settings = getSettings();
  if (settings.getPeerInfo(osConfig.appNs).length) {
    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
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
      'disable-drag': true,
      'headerClass': 'bg-danger u-bg-danger-text'
    };
    if (opt_parent) {
      windowOptions['window-container'] = opt_parent;
    }

    var text = 'This action will clear all locally saved application settings and <b>reload the current page.</b> ';
    text += 'The current state of your application will be lost, so be sure you\'re at a good stopping point.<br>';
    text += '<br>Last reset: ' + settings.getLastReset();
    text += '<br><br><b>Are you sure you want to clear your settings and reload?</b>';

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: clearStorage,
      prompt: text,
      yesText: 'Clear and Reload',
      yesButtonClass: 'btn-danger',
      windowOptions: windowOptions
    }));
  }
};

/**
 * Action for clearing local storage. Should be added to help action managers.
 * @type {!MenuItemOptions}
 */
const resetSettingsOptions = {
  eventType: EventType.DISPLAY_CLEAR_LOCALSTORAGE,
  label: 'Reset Settings',
  tooltip: 'Clears your browser\'s local storage',
  icons: ['<i class="fa fa-fw fa-refresh"></i>'],
  sort: 1000
};

exports = {
  resetSettings,
  resetSettingsOptions
};
