goog.provide('plugin.heatmap.action');

goog.require('os.action.layer');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('plugin.heatmap');


/**
 * KML groups in the layer menu.
 * @enum {string}
 */
plugin.heatmap.action.GroupType = {
  HEATMAP: ('2:' + 'Heatmap')
};


/**
 * Geotagging actions.
 * @enum {string}
 */
plugin.heatmap.action.EventType = {
  EXPORT: 'heatmap:export',
  GENERATE_HEATMAP: 'heatmap:generate'
};


/**
 * Adds heatmap actions to the layer menu.
 */
plugin.heatmap.action.setup = function() {
  os.action.layer.setup();
  var manager = os.action.layer.manager;

  if (!manager.getAction(plugin.heatmap.action.EventType.EXPORT)) {
    var exportHeatmap = new os.ui.action.Action(plugin.heatmap.action.EventType.EXPORT, 'Export Heatmap...',
        'Exports the heatmap as a KML Ground Overlay', 'fa-download', null,
        new os.ui.action.MenuOptions(null, plugin.heatmap.action.GroupType.HEATMAP));
    exportHeatmap.enableWhen(plugin.heatmap.action.isActionSupported_.bind(exportHeatmap));
    manager.addAction(exportHeatmap);
    manager.listen(plugin.heatmap.action.EventType.EXPORT, plugin.heatmap.action.exportLayer_);

    // this action is added for vector layers to be able to generate heatmaps
    var heatmap = new os.ui.action.Action(plugin.heatmap.action.EventType.GENERATE_HEATMAP,
        'Generate Heatmap', 'Generate a heatmap of current features', 'fa-fire', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.TOOLS),
        os.metrics.Layer.HEATMAP);
    heatmap.enableWhen(goog.bind(os.action.layer.isLayerActionSupported,
        heatmap, plugin.heatmap.action.EventType.GENERATE_HEATMAP));
    manager.addAction(heatmap);
    manager.listen(plugin.heatmap.action.EventType.GENERATE_HEATMAP, plugin.heatmap.action.generateHeatmap);
  }
};


/**
 * @param {Object} context
 * @return {boolean}
 * @private
 * @this os.ui.action.Action
 */
plugin.heatmap.action.isActionSupported_ = function(context) {
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      return layer instanceof plugin.heatmap.Heatmap;
    }
  }

  return false;
};


/**
 * Handle heatmap layer actions.
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
plugin.heatmap.action.exportLayer_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    var layer = node.getLayer();
    if (layer instanceof plugin.heatmap.Heatmap) {
      plugin.heatmap.exportHeatmap(layer);
    }
  }
};


/**
 * Handler for heatmap events. Adds a heatmap layer to the map.
 * @param {os.ui.action.ActionEvent} event
 */
plugin.heatmap.action.generateHeatmap = function(event) {
  var context = event.getContext();
  if (context && context.length > 0) {
    var actionLayers = [];

    // queue layers that the action will be run on
    for (var i = 0, n = context.length; i < n; i++) {
      if (context[i] instanceof os.data.LayerNode) {
        var layerNode = /** @type {os.data.LayerNode} */ (context[i]);
        if (layerNode.getLayer()) {
          actionLayers.push(layerNode.getLayer());
        }
      }
    }

    if (actionLayers) {
      for (var i = 0, ii = actionLayers.length; i < ii; i++) {
        var layer = actionLayers[i];
        var source = layer.getSource();
        if (source.getFeatureCount() <= 0) {
          os.alertManager.sendAlert('No features in selected layer. Unable to generate heatmap.',
              os.alert.AlertEventSeverity.WARNING);
        } else {
          plugin.heatmap.createHeatmap(layer);
        }
      }
    }
  }
};
