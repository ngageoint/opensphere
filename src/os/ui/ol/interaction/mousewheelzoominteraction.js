goog.declareModuleId('os.ui.ol.interaction.MouseWheelZoom');

import OLMouseWheelZoom from 'ol/src/interaction/MouseWheelZoom.js';


/**
 * Adjusts the OpenLayers mouse wheel zoom interaction for OpenSphere.
 *
 *
 * @suppress {accessControls} To allow changing private parameters lacking a corresponding options value.
 */
export default class MouseWheelZoom extends OLMouseWheelZoom {
  /**
   * Constructor.
   * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    var options = opt_options || {};

    // change the default zoom timeout period so it feels less sluggish
    options.timeout = options.timeout != null ? options.timeout : 10;

    // disable animation by default
    options.duration = options.duration != null ? options.duration : 10;

    super(options);

    // the default value feels sluggish. this was observed on macOS and may need to be fine tuned for other environments
    this.deltaPerZoom_ = 100;
  }
}
