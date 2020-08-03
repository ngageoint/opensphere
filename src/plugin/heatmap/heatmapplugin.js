goog.provide('plugin.heatmap.HeatmapPlugin');

goog.require('os.data.DataManager');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.HeatmapLayerConfig');
goog.require('plugin.heatmap.menu');



/**
 * Adds the ability to generate a heatmap layer from any vector layer.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.heatmap.HeatmapPlugin = function() {
  plugin.heatmap.HeatmapPlugin.base(this, 'constructor');
  this.id = 'heatmap';
};
goog.inherits(plugin.heatmap.HeatmapPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.heatmap.HeatmapPlugin);


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapPlugin.prototype.init = function() {
  os.layer.config.LayerConfigManager.getInstance().registerLayerConfig(plugin.heatmap.HeatmapLayerConfig.ID,
      plugin.heatmap.HeatmapLayerConfig);

  // setup the layer action manager
  plugin.heatmap.menu.setup();

  // listen for source add so that we can set the action as supported
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, function(event) {
    var source = event.source;
    if (source && source instanceof os.source.Vector) {
      source.setSupportsAction(plugin.heatmap.menu.EventType.GENERATE_HEATMAP, true);
    }
  });
};
