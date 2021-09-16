goog.module('os.interaction.PinchZoom');

const OLPinchZoom = goog.require('ol.interaction.PinchZoom');
const I3DSupport = goog.require('os.I3DSupport');
const osImplements = goog.require('os.implements');


/**
 * Handles the behavior of pinch zooming.
 *
 * @implements {I3DSupport}
 */
class PinchZoom extends OLPinchZoom {
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

exports = PinchZoom;
