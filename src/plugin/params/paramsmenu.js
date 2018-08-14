goog.provide('plugin.params.menu');

goog.require('os.implements');
goog.require('os.ol.source.IUrlSource');
goog.require('os.ui.menu.layer');
goog.require('plugin.params');
goog.require('plugin.params.editRequestParamsDirective');


/**
 * Set up params menu items in the layer menu.
 */
plugin.params.menu.layerSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.params.EventType.EDIT_PARAMS)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.LAYER);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Edit Parameters...',
      eventType: plugin.params.EventType.EDIT_PARAMS,
      tooltip: 'Edit request parameters for the layer',
      icons: ['<i class="fa fa-fw fa-gears"></i>'],
      beforeRender: plugin.params.menu.visibleIfSupported_,
      handler: plugin.params.menu.handleLayerAction_,
      metricKey: plugin.params.Metrics.EDIT_PARAMS
    });
  }
};


/**
 * Clean up params menu items in the layer menu.
 */
plugin.params.menu.layerDispose = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.params.EventType.EDIT_PARAMS)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.LAYER);
    if (group) {
      group.removeChild(plugin.params.EventType.EDIT_PARAMS);
    }
  }
};


/**
 * Test if an event context supports editing layer request parameters.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.params.menu.visibleIfSupported_ = function(context) {
  this.visible = false;

  // only allow editing parameters for one layer at a time
  if (context && context.length === 1) {
    var layers = os.ui.menu.layer.getLayersFromContext(context);
    if (layers && layers.length === 1 && layers[0] instanceof ol.layer.Layer) {
      this.visible = plugin.params.supportsParamOverrides(/** @type {!ol.layer.Layer} */ (layers[0]));
    }
  }
};


/**
 * Handle params event from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.params.menu.handleLayerAction_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  if (layers && layers.length === 1 && layers[0] instanceof ol.layer.Layer) {
    var layer = /** @type {!ol.layer.Layer} */ (layers[0]);
    var params = plugin.params.getParamsFromLayer(layer);
    plugin.params.launchParamsEdit(layer, params);
  } else {
    os.alertManager.sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        os.alert.AlertEventSeverity.WARNING);
  }
};
