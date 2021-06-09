goog.declareModuleId('plugin.electron.menu');

import {launchCustomizeSettings} from './customizesettingswindow';

const {MENU: helpMenu} = goog.require('os.ui.help');


/**
 * Electron menu event types.
 * @enum {string}
 */
export const EventType = {
  CUSTOMIZE_SETTINGS: 'electron:customizeSettings'
};


/**
 * Initialize Support menu items.
 */
export const initSupportMenu = () => {
  const root = helpMenu.getRoot();

  if (root && !root.find(EventType.CUSTOMIZE_SETTINGS)) {
    root.addChild({
      eventType: EventType.CUSTOMIZE_SETTINGS,
      label: 'Customize Settings',
      tooltip: 'Manage settings files loaded by the application',
      icons: ['<i class="fas fa-fw fa-cogs"></i>'],
      handler: launchCustomizeSettings,
      sort: 999 // Immediately before Reset Settings
    });
  }
};
