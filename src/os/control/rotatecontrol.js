goog.provide('os.control.Rotate');

goog.require('ol.control.Rotate');



/**
 * Overrides the OL3 rotate control to allow resetting rotation in Cesium.
 *
 * @param {olx.control.RotateOptions=} opt_options Rotate options.
 * @extends {ol.control.Rotate}
 * @constructor
 */
os.control.Rotate = function(opt_options) {
  var options = opt_options || {};
  options.autoHide = false;
  options.render = os.control.Rotate.render;

  os.control.Rotate.base(this, 'constructor', options);
};
goog.inherits(os.control.Rotate, ol.control.Rotate);


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.control.Rotate.prototype.resetNorth_ = function() {
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    mapContainer.resetRotation();
  } else {
    os.control.Rotate.superClass_.resetNorth_.call(this);
  }
};


/**
 * Update the rotate control element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this ol.control.Rotate
 *
 * @suppress {accessControls}
 */
os.control.Rotate.render = function(mapEvent) {
  var rotation;

  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    var camera = mapContainer.getCesiumCamera();
    if (!camera) {
      return;
    }

    rotation = camera.getHeading();
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
      goog.dom.classlist.enable(
          this.element, ol.css.CLASS_HIDDEN, rotation === 0);
    }
    this.label_.style.msTransform = transform;
    this.label_.style.webkitTransform = transform;
    this.label_.style.transform = transform;
  }

  this.rotation_ = rotation;
};
