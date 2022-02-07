goog.declareModuleId('os.ui.ol.interaction.MouseWheelZoom');

import OLMouseWheelZoom from 'ol/interaction/MouseWheelZoom';


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
    options.duration = options.duration != null ? options.duration : 0;

    super(options);

    // the default value feels sluggish. this was observed on macOS and may need to be fine tuned for other environments
    this.trackpadDeltaPerZoom_ = 100;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} Replacing a private function from OL3.
   */
  handleWheelZoom_(map) {
    if (this.delta_) {
      // lock zoom to increments of 0.2 zoom levels
      this.delta_ = this.delta_ > 0 ? 0.2 : -0.2;
    }

    super.handleWheelZoom_(map);
  }
}
