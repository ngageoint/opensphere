goog.module('plugin.im.action.feature.menu');
goog.module.declareLegacyNamespace();

const AlertManager = goog.require('os.alert.AlertManager');
const {ICON} = goog.require('os.im.action');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const layerMenu = goog.require('os.ui.menu.layer');
const featureAction = goog.require('plugin.im.action.feature');
const launchForLayer = goog.require('plugin.im.action.feature.ui.launchForLayer');


/**
 * Sets up import actions in the layer menu.
 */
const layerSetup = function() {
  var menu = layerMenu.MENU;
  if (menu && !menu.getRoot().find(featureAction.EventType.LAUNCH)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: featureAction.TITLE + '...',
      eventType: featureAction.EventType.LAUNCH,
      tooltip: 'Perform actions on imported data matching a filter',
      icons: ['<i class="fa fa-fw ' + ICON + '"></i>'],
      beforeRender: visibleIfSupported,
      handler: handleLayerAction,
      metricKey: featureAction.Metrics.LAYER_LAUNCH
    });
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
const layerDispose = function() {
  var menu = layerMenu.MENU;
  if (menu && !menu.getRoot().find(featureAction.EventType.LAUNCH)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
    if (group) {
      group.removeChild(featureAction.EventType.LAUNCH);
    }
  }
};


/**
 * If the action arguments support feature actions.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfSupported = function(context) {
  this.visible = false;

  var am = ImportActionManager.getInstance();
  if (am && am.hasActions() && context && context.length == 1) {
    var layers = layerMenu.getLayersFromContext(context).filter(os.MapContainer.isVectorLayer);
    if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
      var source = /** @type {ol.layer.Layer} */ (layers[0]).getSource();
      this.visible = source != null;
    }
  }
};


/**
 * Handle import action event from the layer menu.
 *
 * @param {!os.ui.menu.MenuEvent<layerMenu.Context>} event The menu event.
 * @private
 */
const handleLayerAction = function(event) {
  var layers = layerMenu.getLayersFromContext(event.getContext()).filter(os.MapContainer.isVectorLayer);
  if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
    launchForLayer(layers[0].getId());
  } else {
    AlertManager.getInstance().sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        os.alert.AlertEventSeverity.WARNING);
  }
};

exports = {
  layerSetup,
  layerDispose
};
