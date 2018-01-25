goog.provide('plugin.heatmap.menu');

goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.layer');
goog.require('plugin.heatmap');


/**
 * Heatmap event group label.
 * @type {string}
 * @const
 */
plugin.heatmap.menu.GROUP_LABEL = 'Heatmap';


/**
 * Heatmap menu events.
 * @enum {string}
 */
plugin.heatmap.menu.EventType = {
  EXPORT: 'heatmap:export',
  GENERATE_HEATMAP: 'heatmap:generate'
};


/**
 * Add heatmap menu items to the layer menu.
 */
plugin.heatmap.menu.setup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.heatmap.menu.EventType.EXPORT)) {
    var menuRoot = menu.getRoot();
    var toolsGroup = menuRoot.find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(toolsGroup, 'Group should exist! Check spelling?');

    //
    // TODO: Enable heatmap export after switching to an image layer.
    //

    // menuRoot.addChild({
    //   label: plugin.heatmap.menu.GROUP_LABEL,
    //   type: os.ui.menu.MenuItemType.GROUP,
    //   children: [{
    //     label: 'Export Heatmap...',
    //     eventType: plugin.heatmap.menu.EventType.EXPORT,
    //     tooltip: 'Exports the heatmap as a KML Ground Overlay',
    //     icons: ['<i class="fa fa-fw fa-download"></i>'],
    //     beforeRender: plugin.heatmap.menu.visibleIfSupported_,
    //     handler: plugin.heatmap.menu.exportLayer_,
    //     metricKey: os.metrics.Layer.HEATMAP
    //   }]
    // });

    // this item is added for vector layers to be able to generate heatmaps
    toolsGroup.addChild({
      label: 'Generate Heatmap',
      eventType: plugin.heatmap.menu.EventType.GENERATE_HEATMAP,
      tooltip: 'Generate a heatmap of current features',
      icons: ['<i class="fa fa-fw fa-fire"></i>'],
      beforeRender: os.ui.menu.layer.visibleIfSupported,
      handler: plugin.heatmap.menu.generateHeatmap_,
      metricKey: os.metrics.Layer.HEATMAP
    });
  }
};


/**
 * Show the heatmap menu item if layers in the context support it.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.heatmap.menu.visibleIfSupported_ = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      this.visible = layer instanceof plugin.heatmap.Heatmap;
    }
  }
};


/**
 * Handle heatmap layer export event.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.heatmap.menu.exportLayer_ = function(event) {
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
 * Handle generate heatmap event. Adds a heatmap layer to the map.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.heatmap.menu.generateHeatmap_ = function(event) {
  var context = event.getContext();
  if (context) {
    var layers = os.ui.menu.layer.getLayersFromContext(context);
    if (layers.length) {
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var source = /** @type {os.source.Vector} */ (layer.getSource());
        if (!source || source.getFeatureCount() <= 0) {
          os.alertManager.sendAlert('No features in selected layer. Unable to generate heatmap.',
              os.alert.AlertEventSeverity.WARNING);
        } else {
          plugin.heatmap.createHeatmap(layer);
        }
      }
    }
  }
};
