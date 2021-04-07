goog.module('plugin.cesium.menu');

const importMenu = goog.require('os.ui.menu.import');
const osWindow = goog.require('os.ui.window');
const cesium = goog.require('plugin.cesium');
const {directiveTag: importIonAssetTag} = goog.require('plugin.cesium.ImportIonAssetUI');


/**
 * Cesium menu event types.
 * @enum {string}
 */
const EventType = {
  ADD_ION_RESOURCE: 'cesium:addIonResource'
};

/**
 * Add Cesium items to the import menu.
 */
const importSetup = function() {
  if (importMenu.MENU && cesium.isIonEnabled()) {
    var group = importMenu.MENU.getRoot().find(importMenu.GroupType.MAJOR);
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
const launchAddIonAsset = function() {
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

exports = {
  EventType,
  importSetup,
  launchAddIonAsset
};
