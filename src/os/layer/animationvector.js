goog.declareModuleId('os.layer.AnimationVector');

import OLEventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';

import OLVectorLayer from 'ol/src/layer/Vector.js';
import RenderEventType from 'ol/src/render/EventType.js';
import {getUid} from 'ol/src/util.js';


/**
 * Vector layer extension created solely for the purpose of z-indexing unmanaged animation layers against each other.
 */
export default class AnimationVector extends OLVectorLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorOptions} options Vector layer options
   */
  constructor(options) {
    super(options);
  }

  /**
   * This function is replaced because the OL version sets the zIndex to Infinity, making all unmanaged layers the same.
   * We still want them to appear on top, but be ordered against one another.
   *
   * @inheritDoc
   * @suppress {accessControls}
   */
  setMap(map) {
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
      this.mapPrecomposeKey_ = listen(map, RenderEventType.PRECOMPOSE, (evt) => {
        var layerState = this.getLayerState();
        layerState.managed = false;

        // offset the z-index by a large enough number that it will push these layers to the top, but they will still
        // be ordered against each other
        layerState.zIndex += AnimationVector.Z_OFFSET;

        evt.frameState.layerStatesArray.push(layerState);
        evt.frameState.renderTargets[getUid(this)] = layerState;
      });

      this.mapRenderKey_ = listen(this, OLEventType.CHANGE, map.render, map);
      this.changed();
    }
  }
}

/**
 * Base offset applied to animation vector layers.
 * @type {number}
 * @const
 */
AnimationVector.Z_OFFSET = 100000;
