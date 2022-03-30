goog.declareModuleId('os.ui.ol.interaction.AreaHover');

import {pointerMove} from 'ol/src/events/condition.js';
import Select from 'ol/src/interaction/Select.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import ViewHint from 'ol/src/ViewHint.js';

import {getAreaManager} from '../../../query/queryinstance.js';
import * as area from '../../../style/areastyle.js';
import TimelineController from '../../../time/timelinecontroller.js';
import OLMap from '../olmap.js';
import {getEventFeature, getFirstPolygon} from './interaction.js';

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
    this.handleEvent = this.handleEvent_;

    var options = opt_options || {};
    this.condition = options.condition || pointerMove;
  }

  /**
   * @param {MapBrowserEvent} event Map browser event.
   * @return {boolean} 'false' to stop event propagation.
   * @this AreaHover
   * @private
   */
  handleEvent_(event) {
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
