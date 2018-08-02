goog.provide('os.interaction.Select');

goog.require('ol.Feature');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.interaction');
goog.require('os.source.Vector');



/**
 * Handles selection of vector features
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @implements {os.I3DSupport}
 * @param {olx.interaction.SelectOptions=} opt_options Options.
 */
os.interaction.Select = function(opt_options) {
  os.interaction.Select.base(this, 'constructor', {
    handleEvent: os.interaction.Select.handleEvent_
  });

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.EventsConditionType}
   * @protected
   */
  this.condition = goog.isDef(options.condition) ? options.condition : ol.events.condition.singleClick;

  var layerFilter;
  if (options.layers != null) {
    if (goog.isFunction(options.layers)) {
      layerFilter = options.layers;
    } else {
      var layers = options.layers;
      /**
       * @param {ol.layer.Layer} layer Layer.
       * @return {boolean} Include.
       */
      layerFilter = function(layer) {
        return goog.array.contains(layers, layer);
      };
    }
  } else {
    layerFilter = os.interaction.defaultLayerFilter;
  }

  /**
   * @type {function(ol.layer.Layer): boolean}
   * @protected
   */
  this.layerFilter = layerFilter;

  /**
   * @type {boolean}
   * @private
   */
  this.supports3D_ = true;

  /**
   * Gets whether selection behavior is additive (true) or set (false).
   * @type {boolean}
   */
  this.selectionBehavior = /** @type {boolean} */ (os.settings.get('interaction.selectionBehavior', true));
};
goog.inherits(os.interaction.Select, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
os.interaction.Select.prototype.is3DSupported = function() {
  return this.supports3D_;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 * @this os.interaction.Select
 * @private
 *
 * Select/highlight the item and return
 * If the item is a polygon, return but continue to process events
 * so we can load/add/save as a potential new area
 */
os.interaction.Select.handleEvent_ = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;

  if (!this.condition(mapBrowserEvent) || map.getView().getHints()[ol.ViewHint.INTERACTING] > 0) {
    return true;
  }

  var selectionBehavior = this.selectionBehavior;

  try {
    var source;
    var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         * @return {ol.Feature|ol.render.Feature|undefined} The feature, or undefined if no feature hit
         */
        function(feature, layer) {
          if (feature instanceof ol.Feature) {
            source = os.feature.getSource(feature, layer);

            if (source instanceof os.source.Vector) {
              if (source.isSelected(feature)) {
                source.removeFromSelected([feature]);
              } else {
                selectionBehavior ? source.addToSelected([feature]) : source.setSelectedItems(feature);
              }

              return feature;
            }
          }

          return undefined;
        }, {
          layerFilter: this.layerFilter
        });
  } catch (e) {
  }

  if (!feature) {
    // no feature, so allow the event to proceed and do other things
    return true;
  }

  var geometry = feature.getGeometry();
  var geomType = geometry && geometry.getType() || null;
  if (geomType == ol.geom.GeometryType.POLYGON || geomType == ol.geom.GeometryType.MULTI_POLYGON) {
    // selected a polygon that is not in the area list. return true so we can bring up the spatial menu.
    return true;
  }

  // kill the event for everything else
  return false;
};

