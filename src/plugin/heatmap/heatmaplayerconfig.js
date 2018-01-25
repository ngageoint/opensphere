goog.provide('plugin.heatmap.HeatmapLayerConfig');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.source.Vector');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('plugin.heatmap.Heatmap');



/**
 * Config for a layer containing heatmap data.
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 * @template T
 */
plugin.heatmap.HeatmapLayerConfig = function() {
  plugin.heatmap.HeatmapLayerConfig.base(this, 'constructor');
  this.log = plugin.heatmap.HeatmapLayerConfig.LOGGER_;

  /**
   * @type {boolean}
   * @protected
   */
  this.animate = false;
};
goog.inherits(plugin.heatmap.HeatmapLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Id for this layer config
 * @type {string}
 * @const
 */
plugin.heatmap.HeatmapLayerConfig.ID = 'heatmap';


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.heatmap.HeatmapLayerConfig.LOGGER_ = goog.log.getLogger('plugin.heatmap.HeatmapLayerConfig');


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);
  var layer = this.getLayer(source, options);
  layer.setId(/** @type {string} */ (options['id']));

  if (goog.isDefAndNotNull(options['explicitType'])) {
    layer.setExplicitType(/** @type {string} */ (options['explicitType']));
  }

  return layer;
};


/**
 * @param {ol.source.Vector} source The layer source.
 * @param {Object<string, *>} options
 * @return {plugin.heatmap.Heatmap}
 * @protected
 */
plugin.heatmap.HeatmapLayerConfig.prototype.getLayer = function(source, options) {
  return new plugin.heatmap.Heatmap({
    'source': source,
    'title': options['title']
  });
};


/**
 * @param {Object} options Layer configuration options.
 * @return {ol.source.Vector}
 * @protected
 *
 * @suppress {checkTypes}
 */
plugin.heatmap.HeatmapLayerConfig.prototype.getSource = function(options) {
  options = options || {};

  var sourceId = /** @type {string|undefined} */ (options['sourceId']);
  options.features = plugin.heatmap.getSourceFeatures(sourceId);

  return new ol.source.Vector(options);
};
