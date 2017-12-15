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
 * Overridden to use smaller zoom increments
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
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
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ? options.condition :
      goog.functions.and(ol.events.condition.noModifierKeys,
          ol.events.condition.targetNotEditable);
};
goog.inherits(os.interaction.KeyboardTiltRotate, ol.interaction.Interaction);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.KeyboardTiltRotate
 * @suppress {duplicate}
 */
os.interaction.KeyboardTiltRotate.handleEvent = function(mapBrowserEvent) {
  if (!os.MapContainer.getInstance().is3DEnabled) {
    // Only handle things in 3d
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
 * Spin the globe
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.tilt = function(mapBrowserEvent) {
  var stopEvent = false;
  var map = os.MapContainer.getInstance();
  if (map.is3DEnabled()) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;

    var cesium = map.getOLCesium();
    var camera = cesium.getCamera();
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
 * Spin the globe
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.rotate = function(mapBrowserEvent) {
  // Only rotate if in 3D
  var stopEvent = false;
  var map = os.MapContainer.getInstance();
  if (map.is3DEnabled()) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;

    var cesium = map.getOLCesium();
    var camera = cesium.getCesiumScene().camera;
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
 * Spin the globe
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean}
 */
os.interaction.KeyboardTiltRotate.prototype.spin = function(mapBrowserEvent) {
  var stopEvent = false;
  var map = os.MapContainer.getInstance();
  if (map.is3DEnabled()) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;

    var cesium = map.getOLCesium();
    var camera = cesium.getCesiumScene().camera;
    var view = map.getMap().getView();
    goog.asserts.assert(!goog.isNull(view), 'view should not be null');
    var viewState = view.getState();
    var mapUnitsDelta = viewState.resolution * 2;
    if (keyCode == goog.events.KeyCodes.DOWN) {
      camera.rotateUp(mapUnitsDelta);
    } else if (keyCode == goog.events.KeyCodes.LEFT) {
      camera.rotateLeft(mapUnitsDelta);
    } else if (keyCode == goog.events.KeyCodes.RIGHT) {
      camera.rotateRight(mapUnitsDelta);
    } else {
      camera.rotateDown(mapUnitsDelta);
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
