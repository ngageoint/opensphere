goog.declareModuleId('plugin.electron.menu');

import {MENU as helpMenu} from '../../os/ui/help/help.js';
import {launchCustomizeSettings} from './customizesettingswindow';


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
  if (ElectronOS.supportsUserSettings()) {
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
  }
};
