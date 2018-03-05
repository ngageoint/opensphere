goog.provide('os.ui.ol.interaction.MouseWheelZoom');

goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.MouseWheelZoom');


/**
 * Adjusts the OpenLayers mouse wheel zoom interaction for OpenSphere.
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
 * @extends {ol.interaction.MouseWheelZoom}
 * @constructor
 *
 * @suppress {accessControls} To allow changing private parameters lacking a corresponding options value.
 */
os.ui.ol.interaction.MouseWheelZoom = function(opt_options) {
  var options = opt_options || {};

  // change the default zoom timeout period so it feels less sluggish
  options.timeout = options.timeout != null ? options.timeout : 10;

  // disable animation by default
  options.duration = options.duration != null ? options.duration : 0;

  os.ui.ol.interaction.MouseWheelZoom.base(this, 'constructor', opt_options);

  // the default value feels sluggish. this was observed on macOS and may need to be fine tuned for other environments
  this.trackpadDeltaPerZoom_ = 100;
};
goog.inherits(os.ui.ol.interaction.MouseWheelZoom, ol.interaction.MouseWheelZoom);


/**
 * @inheritDoc
 * @suppress {accessControls} Replacing a private function from OL3.
 */
os.ui.ol.interaction.MouseWheelZoom.prototype.handleWheelZoom_ = function(map) {
  if (this.delta_) {
    // lock zoom to increments of 0.2 zoom levels
    this.delta_ = this.delta_ > 0 ? 0.2 : -0.2;
  }

  os.ui.ol.interaction.MouseWheelZoom.base(this, 'handleWheelZoom_', map);
};
