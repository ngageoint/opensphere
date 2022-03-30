goog.declareModuleId('os.interaction.PinchZoom');

import OLPinchZoom from 'ol/src/interaction/PinchZoom.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';


/**
 * Handles the behavior of pinch zooming.
 *
 * @implements {I3DSupport}
 */
export default class PinchZoom extends OLPinchZoom {
  /**
   * Constructor.
   * @param {olx.interaction.PinchZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    // handled directly by WebGL renderers
    return false;
  }
}

osImplements(PinchZoom, I3DSupport.ID);
