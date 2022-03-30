goog.declareModuleId('os.interaction.Select');

import {singleClick} from 'ol/src/events/condition.js';
import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Interaction from 'ol/src/interaction/Interaction.js';
import ViewHint from 'ol/src/ViewHint.js';

import Settings from '../config/settings.js';
import {getSource} from '../feature/feature.js';
import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import VectorSource from '../source/vectorsource.js';
import {defaultLayerFilter} from './interaction.js';


/**
 * Handles selection of vector features
 *
 * @implements {I3DSupport}
 */
export default class Select extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.SelectOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super({
      handleEvent: Select.handleEvent_
    });

    var options = opt_options !== undefined ? opt_options : {};

    /**
     * @type {ol.EventsConditionType}
     * @protected
     */
    this.condition = options.condition !== undefined ? options.condition : singleClick;

    var layerFilter;
    if (options.layers != null) {
      if (typeof options.layers === 'function') {
        layerFilter = options.layers;
      } else {
        var layers = options.layers;
        /**
         * @param {Layer} layer Layer.
         * @return {boolean} Include.
         */
        layerFilter = function(layer) {
          return layers.includes(layer);
        };
      }
    } else {
      layerFilter = defaultLayerFilter;
    }

    /**
     * @type {function(Layer): boolean}
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
    this.selectionBehavior = /** @type {boolean} */ (Settings.getInstance().get('interaction.selectionBehavior', true));
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return this.supports3D_;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} 'false' to stop event propagation.
   * @this Select
   * @private
   *
   * Select/highlight the item and return
   * If the item is a polygon, return but continue to process events
   * so we can load/add/save as a potential new area
   */
  static handleEvent_(mapBrowserEvent) {
    var map = mapBrowserEvent.map;

    if (!this.condition(mapBrowserEvent) || map.getView().getHints()[ViewHint.INTERACTING] > 0) {
      return true;
    }

    var selectionBehavior = this.selectionBehavior;

    try {
      var source;
      var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
          /**
           * @param {Feature|RenderFeature} feature Feature.
           * @param {Layer} layer Layer.
           * @return {Feature|RenderFeature|undefined} The feature, or undefined if no feature hit
           */
          function(feature, layer) {
            if (feature instanceof Feature) {
              source = getSource(feature, layer);

              if (source instanceof VectorSource) {
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
    if (geomType == GeometryType.POLYGON || geomType == GeometryType.MULTI_POLYGON) {
      // selected a polygon that is not in the area list. return true so we can bring up the spatial menu.
      return true;
    }

    // kill the event for everything else
    return false;
  }
}

osImplements(Select, I3DSupport.ID);
