goog.declareModuleId('os.ui.ol.interaction.AreaHover');

import OLMap from '../olmap.js';
import {getEventFeature, getFirstPolygon} from './interaction.js';

const ViewHint = goog.require('ol.ViewHint');
const {pointerMove} = goog.require('ol.events.condition');
const Select = goog.require('ol.interaction.Select');
const OLVectorLayer = goog.require('ol.layer.Vector');
const {getAreaManager} = goog.require('os.query.instance');
const area = goog.require('os.style.area');
const TimelineController = goog.require('os.time.TimelineController');

const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');


/**
 * Handles hover/highlight of areas
 */
export default class AreaHover extends Select {
  /**
   * Constructor.
   * @param {olx.interaction.SelectOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.handleEvent = AreaHover.handleEvent_;

    var options = opt_options || {};
    this.condition = options.condition || pointerMove;
  }

  /**
   * @param {MapBrowserEvent} event Map browser event.
   * @return {boolean} 'false' to stop event propagation.
   * @this AreaHover
   * @private
   */
  static handleEvent_(event) {
    if (!this.condition(event)) {
      return true;
    }

    var container = $('#map-container');
    container.css('cursor', 'auto');

    var map = event.map;
    var tlc = TimelineController.getInstance();

    if (map.getView().getHints()[ViewHint.INTERACTING] <= 0 && !tlc.isPlaying()) {
      var feature = getEventFeature(event, getFirstPolygon);
      if (feature) {
        getAreaManager().highlight(feature);
        container.css('cursor', 'pointer');
      }

      var layers = map.getLayers().getArray();
      var source = null;
      // get the drawing layer/source
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.get('id') == OLMap.DRAW_ID && layer instanceof OLVectorLayer) {
          source = /** @type {OLVectorLayer} */ (layer).getSource();
          break;
        }
      }

      if (source) {
        var features = source.getFeatures();
        for (var i = 0, n = features.length; i < n; i++) {
          var f = features[i];
          if (feature !== f) {
            if (f.getStyle() === area.HOVER_STYLE) {
              getAreaManager().unhighlight(f);
            }
          }
        }
      }
    }

    return true;
  }
}
