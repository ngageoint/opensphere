goog.provide('plugin.im.action.feature.menu');

goog.require('os.action.common');
goog.require('os.action.layer');
goog.require('os.im.action');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('plugin.im.action.feature');


/**
 * Sets up import actions in the Layers window.
 */
plugin.im.action.feature.layerSetup = function() {
  var manager = os.action && os.action.layer ? os.action.layer.manager : null;
  var featureActionEvent = os.action.layer.PREFIX + plugin.im.action.feature.EventType.LAUNCH;
  if (manager && !manager.getAction(featureActionEvent)) {
    var featureActionTitle = plugin.im.action.feature.TITLE + '...';
    var featureActions = new os.ui.action.Action(featureActionEvent,
        featureActionTitle, 'Perform actions on imported data matching a filter', os.im.action.ICON, null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.TOOLS),
        plugin.im.action.feature.Metrics.LAYER_LAUNCH);
    featureActions.enableWhen(plugin.im.action.feature.supportsFeatureActions);
    manager.addAction(featureActions);

    manager.listen(featureActionEvent, plugin.im.action.feature.handleLayerAction_);
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
plugin.im.action.feature.layerDispose = function() {
  if (os.action && os.action.layer && os.action.layer.manager) {
    var featureActionEvent = os.action.layer.PREFIX + plugin.im.action.feature.EventType.LAUNCH;
    os.action.layer.manager.removeAction(featureActionEvent);
    os.action.layer.manager.unlisten(featureActionEvent, plugin.im.action.feature.handleLayerAction_);
  }
};


/**
 * If the action arguments support feature actions.
 * @param {*=} opt_actionArgs The action arguments.
 * @return {boolean}
 */
plugin.im.action.feature.supportsFeatureActions = function(opt_actionArgs) {
  var am = os.im.action.ImportActionManager.getInstance();
  if (am && am.hasActions() && opt_actionArgs != null && opt_actionArgs.length == 1) {
    var layers = os.action.layer.getLayersFromContext(opt_actionArgs).filter(os.MapContainer.isVectorLayer);
    if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
      var source = /** @type {ol.layer.Layer} */ (layers[0]).getSource();
      return os.implements(source, os.source.IImportSource.ID);
    }
  }

  return false;
};


/**
 * Handle import action events from the Layers window.
 * @param {os.ui.action.ActionEvent} event The event.
 * @private
 */
plugin.im.action.feature.handleLayerAction_ = function(event) {
  var layers = os.action.layer.getLayersFromContext(event.getContext()).filter(os.MapContainer.isVectorLayer);
  if (layers && layers.length == 1 && layers[0].getOSType() != os.layer.LayerType.REF) {
    plugin.im.action.feature.launchForLayer(layers[0].getId());
  } else {
    os.alertManager.sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        os.alert.AlertEventSeverity.WARNING);
  }
};
