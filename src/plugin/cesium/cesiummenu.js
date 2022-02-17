goog.declareModuleId('plugin.cesium.menu');

import * as importMenu from '../../os/ui/menu/importmenu.js';
import * as osWindow from '../../os/ui/window.js';
import {isIonEnabled} from './cesium.js';
import {directiveTag as importIonAssetTag} from './importionasset.js';

/**
 * Cesium menu event types.
 * @enum {string}
 */
export const EventType = {
  ADD_ION_RESOURCE: 'cesium:addIonResource'
};

/**
 * Add Cesium items to the import menu.
 */
export const importSetup = function() {
  if (importMenu.getMenu() && isIonEnabled()) {
    var group = importMenu.getMenu().getRoot().find(importMenu.GroupType.MAJOR);
    group.addChild({
      label: 'Add Cesium Ion Asset',
      eventType: EventType.ADD_ION_RESOURCE,
      tooltip: 'Loads a Cesium Ion asset in 3D mode',
      icons: ['<i class="fa fa-fw fa-plus"></i>'],
      handler: launchAddIonAsset,
      sort: 10
    });
  }
};

/**
 * Launch a dialog to add a Cesium Ion asset.
 */
export const launchAddIonAsset = function() {
  var windowId = 'importIonAsset';
  var windowOptions = {
    'id': windowId,
    'label': 'Import Cesium Ion Asset',
    'icon': 'fa fa-plus',
    'x': 'center',
    'y': 'center',
    'width': 425,
    'min-width': 300,
    'max-width': 800,
    'height': 'auto',
    'show-close': true,
    'modal': false
  };

  var template = `<${importIonAssetTag}></${importIonAssetTag}>`;
  osWindow.create(windowOptions, template);
};
