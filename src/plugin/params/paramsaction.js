goog.provide('plugin.params.action');

goog.require('os.action.layer');
goog.require('os.implements');
goog.require('os.ol.source.IUrlSource');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('plugin.params');
goog.require('plugin.params.editRequestParamsDirective');


/**
 * Sets up params actions in the Layers window.
 */
plugin.params.action.layerSetup = function() {
  var manager = os.action && os.action.layer ? os.action.layer.manager : null;
  var editParamsEvent = os.action.layer.PREFIX + plugin.params.EventType.EDIT_PARAMS;
  if (manager && !manager.getAction(editParamsEvent)) {
    var editParams = new os.ui.action.Action(editParamsEvent,
        'Edit Parameters...', 'Edit request parameters for the layer.', 'fa-gears', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        plugin.params.Metrics.EDIT_PARAMS);
    editParams.enableWhen(plugin.params.action.supportsEdit_);
    manager.addAction(editParams);

    manager.listen(editParamsEvent, plugin.params.action.handleLayerAction_);
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
plugin.params.action.layerDispose = function() {
  if (os.action && os.action.layer && os.action.layer.manager) {
    var editParamsEvent = os.action.layer.PREFIX + plugin.params.EventType.EDIT_PARAMS;
    os.action.layer.manager.removeAction(editParamsEvent);
    os.action.layer.manager.unlisten(editParamsEvent, plugin.params.action.handleLayerAction_);
  }
};


/**
 * Test if an action event context supports editing layer request parameters.
 * @param {*} context The event context.
 * @return {boolean} If the event has a layer that supports request parameters.
 */
plugin.params.action.supportsEdit_ = function(context) {
  // only allow editing parameters for one layer at a time
  var layers = os.action.layer.getLayersFromContext(context);
  if (layers == null || layers.length != 1 || !(layers[0] instanceof ol.layer.Layer)) {
    return false;
  }

  var layer = /** @type {!ol.layer.Layer} */ (layers[0]);
  return plugin.params.supportsParamOverrides(layer);
};


/**
 * Handle params actions from the Layers window.
 * @param {os.ui.action.ActionEvent} event The event.
 * @private
 */
plugin.params.action.handleLayerAction_ = function(event) {
  var layers = os.action.layer.getLayersFromContext(event.getContext());
  if (layers != null && layers.length == 1 && layers[0] instanceof ol.layer.Layer) {
    var layer = /** @type {!ol.layer.Layer} */ (layers[0]);
    var params = plugin.params.getParamsFromLayer(layer);
    plugin.params.launchParamsEdit(layer, params);
  } else {
    os.alertManager.sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        os.alert.AlertEventSeverity.WARNING);
  }
};
