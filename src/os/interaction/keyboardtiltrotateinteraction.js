goog.provide('os.interaction.KeyboardTiltRotate');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.MapBrowserEvent');
goog.require('ol.events.EventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.MapContainer');
goog.require('os.ui.ol.interaction');



/**
 * Interaction to tilt/rotate/spin the 3D globe with the keyboard.
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 * @implements {os.I3DSupport}
 * @constructor
 */
os.interaction.KeyboardTiltRotate = function(opt_options) {
  var options = opt_options || {};

  os.interaction.KeyboardTiltRotate.base(this, 'constructor', {
    handleEvent: os.interaction.KeyboardTiltRotate.handleEvent
  });

  /**
   * The keyCode of the most recent keydown event.
   * @type {number}
   * @private
   */
  this.lastKeyCode_ = 0;

  /**
   * Condition to trigger handling the event.
   * @type {ol.EventsConditionType}
   * @private
   */
  this.condition_ = options.condition != null ? options.condition :
      goog.functions.and(ol.events.condition.noModifierKeys,
          ol.events.condition.targetNotEditable);
};
goog.inherits(os.interaction.KeyboardTiltRotate, ol.interaction.Interaction);


/**
 * Multiplier to use when spinning the globe. This is based off of using the view resolution, which is measured in
 * units per pixel.
 * @type {number}
 * @const
 */
os.interaction.KeyboardTiltRotate.SPIN_DELTA = 100;


/**
 * Handle the map browser event.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.KeyboardTiltRotate
 */
os.interaction.KeyboardTiltRotate.handleEvent = function(mapBrowserEvent) {
  if (!os.MapContainer.getInstance().is3DEnabled) {
    // Only handle things in 3D
    return false;
  }

  // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN) {
    this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
  }

  // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
  var stopEvent = false;
  if (mapBrowserEvent.type == os.ui.ol.interaction.KEY_TYPE) {
    var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

    if (keyCode == goog.events.KeyCodes.LEFT ||
        keyCode == goog.events.KeyCodes.RIGHT) {
      if (this.condition_(mapBrowserEvent)) {
        stopEvent = this.spin(mapBrowserEvent);
      } else if (ol.events.condition.shiftKeyOnly(mapBrowserEvent)) {
        stopEvent = this.rotate(mapBrowserEvent);
      }
    } else if (keyCode == goog.events.KeyCodes.DOWN || keyCode == goog.events.KeyCodes.UP) {
      if (this.condition_(mapBrowserEvent)) {
        stopEvent = this.spin(mapBrowserEvent);
      } else if (ol.events.condition.shiftKeyOnly(mapBrowserEvent)) {
        stopEvent = this.tilt(mapBrowserEvent);
      }
    }
  }

  if (stopEvent) {
    mapBrowserEvent.preventDefault();
  }

  return !stopEvent;
};


/**
 * Tilt the globe.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.tilt = function(mapBrowserEvent) {
  var stopEvent = false;
  var map = os.MapContainer.getInstance();
  var camera = map.getWebGLCamera();
  if (map.is3DEnabled() && camera) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    var mapUnitsDelta = .05;
    var delta = 0;

    if (keyCode == goog.events.KeyCodes.DOWN) {
      delta = mapUnitsDelta;
    } else {
      delta = -mapUnitsDelta;
    }

    camera.setTilt(camera.getTilt() + delta);
    stopEvent = true;
  }
  return stopEvent;
};


/**
 * Rotate the globe.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.rotate = function(mapBrowserEvent) {
  var stopEvent = false;

  // Only rotate if in 3D
  var map = os.MapContainer.getInstance();
  var camera = map.getWebGLCamera();
  if (map.is3DEnabled() && camera) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    if (keyCode == goog.events.KeyCodes.LEFT) {
      camera.twistLeft();
    } else {
      camera.twistRight();
    }

    stopEvent = true;
  }
  return stopEvent;
};


/**
 * Spin the globe.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.spin = function(mapBrowserEvent) {
  var stopEvent = false;
  var map = os.MapContainer.getInstance();
  var camera = map.getWebGLCamera();
  if (map.is3DEnabled() && camera) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;

    var view = map.getMap().getView();
    goog.asserts.assert(!goog.isNull(view), 'view should not be null');
    var viewState = view.getState();

    // transform the resolution to degrees, then to radians for the camera
    var ll = ol.proj.transform([viewState.resolution, 0], os.map.PROJECTION, os.proj.EPSG4326);
    var mapUnitsDelta = goog.math.toRadians(ll[0] * os.interaction.KeyboardTiltRotate.SPIN_DELTA);

    switch (keyCode) {
      case goog.events.KeyCodes.UP:
        camera.rotateDown(mapUnitsDelta);
        break;
      case goog.events.KeyCodes.DOWN:
        camera.rotateUp(mapUnitsDelta);
        break;
      case goog.events.KeyCodes.LEFT:
        camera.rotateLeft(mapUnitsDelta);
        break;
      case goog.events.KeyCodes.RIGHT:
        camera.rotateRight(mapUnitsDelta);
        break;
      default:
        break;
    }

    stopEvent = true;
  }
  return stopEvent;
};


/**
 * @inheritDoc
 */
os.interaction.KeyboardTiltRotate.prototype.is3DSupported = function() {
  return true;
};
