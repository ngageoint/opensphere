goog.declareModuleId('os.mixin.layer');

import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import Layer from 'ol/src/layer/Layer.js';
import RenderEventType from 'ol/src/render/EventType.js';

/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  Layer.prototype.setMap = function(map) {
    if (this.mapPrecomposeKey_) {
      unlistenByKey(this.mapPrecomposeKey_);
      this.mapPrecomposeKey_ = null;
    }
    if (!map) {
      this.changed();
    }
    if (this.mapRenderKey_) {
      unlistenByKey(this.mapRenderKey_);
      this.mapRenderKey_ = null;
    }
    if (map) {
      this.mapPrecomposeKey_ = listen(
          map,
          RenderEventType.PRECOMPOSE,
          function(evt) {
            const renderEvent =
              /** @type {import("../render/Event.js").default} */ (evt);
            const layerStatesArray = renderEvent.frameState.layerStatesArray;
            const layerState = this.getLayerState(false);
            if (!layerStatesArray.some(function(arrayLayerState) {
              return arrayLayerState.layer === layerState.layer;
            })) {
              layerStatesArray.push(layerState);
            }
          },
          this
      );
      this.mapRenderKey_ = listen(this, EventType.CHANGE, map.render, map);
      this.changed();
    }
  };
};

init();
