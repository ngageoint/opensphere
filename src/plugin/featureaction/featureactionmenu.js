goog.provide('plugin.im.action.feature.menu');

goog.require('os.im.action');
goog.require('os.ui.menu.layer');
goog.require('plugin.im.action.feature');


/**
 * Sets up import actions in the layer menu.
 */
plugin.im.action.feature.layerSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.im.action.feature.EventType.LAUNCH)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: plugin.im.action.feature.TITLE + '...',
      eventType: plugin.im.action.feature.EventType.LAUNCH,
      tooltip: 'Perform actions on imported data matching a filter',
      icons: ['<i class="fa fa-fw ' + os.im.action.ICON + '"></i>'],
      beforeRender: plugin.im.action.feature.visibleIfSupported,
      handler: plugin.im.action.feature.handleLayerAction_,
      metricKey: plugin.im.action.feature.Metrics.LAYER_LAUNCH
    });
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
plugin.im.action.feature.layerDispose = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.im.action.feature.EventType.LAUNCH)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS);
    if (group) {
      group.removeChild(plugin.im.action.feature.EventType.LAUNCH);
    }
  }
};


/**
 * If the action arguments support feature actions.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.im.action.feature.visibleIfSupported = function(context) {
  this.visible = false;

  var am = os.im.action.ImportActionManager.getInstance();
  if (am && am.hasActions() && context && context.length == 1) {
    var layers = os.ui.menu.layer.getLayersFromContext(context).filter(os.MapContainer.isVectorLayer);
    if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
      var source = /** @type {ol.layer.Layer} */ (layers[0]).getSource();
      this.visible = os.implements(source, os.source.IImportSource.ID);
    }
  }
};


/**
 * Handle import action event from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.im.action.feature.handleLayerAction_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext()).filter(os.MapContainer.isVectorLayer);
  if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
    plugin.im.action.feature.launchForLayer(layers[0].getId());
  } else {
    os.alertManager.sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        os.alert.AlertEventSeverity.WARNING);
  }
};
