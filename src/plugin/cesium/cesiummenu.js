goog.provide('plugin.cesium.menu');

goog.require('plugin.cesium.importIonAssetDirective');


/**
 * Cesium menu event types.
 * @enum {string}
 */
plugin.cesium.menu.EventType = {
  ADD_ION_RESOURCE: 'cesium:addIonResource'
};


/**
 * Add Cesium items to the import menu.
 */
plugin.cesium.menu.importSetup = function() {
  var group = os.ui.menu.import.MENU.getRoot().find(os.ui.menu.import.GroupType.MAJOR);
  group.addChild({
    label: 'Add Cesium Ion Asset',
    eventType: plugin.cesium.menu.EventType.ADD_ION_RESOURCE,
    tooltip: 'Loads a Cesium Ion asset in 3D mode',
    icons: ['<i class="fa fa-fw fa-plus"></i>'],
    handler: plugin.cesium.menu.launchAddIonAsset,
    sort: 10
  });
};


/**
 * Launch a dialog to add a Cesium Ion asset.
 */
plugin.cesium.menu.launchAddIonAsset = function() {
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

  var template = '<importionasset></importionasset>';
  os.ui.window.create(windowOptions, template);
};
