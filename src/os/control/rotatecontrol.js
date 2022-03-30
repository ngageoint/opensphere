goog.declareModuleId('os.control.Rotate');

import OLRotate from 'ol/src/control/Rotate.js';
import {CLASS_HIDDEN} from 'ol/src/css.js';

import {getMapContainer} from '../map/mapinstance.js';

const classlist = goog.require('goog.dom.classlist');


/**
 * Overrides the OpenLayers rotate control to allow resetting rotation in WebGL.
 */
export default class Rotate extends OLRotate {
  /**
   * Constructor.
   * @param {olx.control.RotateOptions=} opt_options Rotate options.
   */
  constructor(opt_options) {
    var options = opt_options || {};
    options.autoHide = false;
    options.render = render;

    super(options);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  resetNorth_() {
    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      mapContainer.resetRotation();
    } else {
      super.resetNorth_();
    }
  }
}

/**
 * Update the rotate control element.
 *
 * @param {ol.MapEvent} mapEvent Map event.
 * @this OLRotate
 *
 * @suppress {accessControls}
 */
const render = function(mapEvent) {
  var rotation;

  var mapContainer = getMapContainer();
  if (mapContainer.is3DEnabled()) {
    var camera = mapContainer.getWebGLCamera();
    if (!camera) {
      return;
    }

    // OpenLayers rotation is in the opposite direction of WebGL camera heading.
    rotation = -camera.getHeading();
  } else {
    var frameState = mapEvent.frameState;
    if (!frameState) {
      return;
    }
    rotation = frameState.viewState.rotation;
  }

  if (rotation != this.rotation_) {
    var transform = 'rotate(' + rotation + 'rad)';
    if (this.autoHide_) {
      classlist.enable(
          this.element, CLASS_HIDDEN, rotation === 0);
    }
    this.label_.style.msTransform = transform;
    this.label_.style.webkitTransform = transform;
    this.label_.style.transform = transform;
  }

  this.rotation_ = rotation;
};
