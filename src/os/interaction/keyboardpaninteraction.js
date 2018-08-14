goog.provide('os.interaction.KeyboardPan');

goog.require('ol.events.EventType');
goog.require('ol.interaction.KeyboardPan');
goog.require('os.I3DSupport');
goog.require('os.implements');
goog.require('os.ui.ol.interaction');



/**
 * @param {olx.interaction.KeyboardPanOptions=} opt_options Options.
 * @extends {ol.interaction.KeyboardPan}
 * @implements {os.I3DSupport}
 * @constructor
 */
os.interaction.KeyboardPan = function(opt_options) {
  os.interaction.KeyboardPan.base(this, 'constructor', opt_options);

  /**
   * The keyCode of the most recent keydown event.
   * @type {number}
   * @private
   */
  this.lastKeyCode_ = 0;
};
goog.inherits(os.interaction.KeyboardPan, ol.interaction.KeyboardPan);
os.implements(os.interaction.KeyboardPan, os.I3DSupport.ID);

/**
 * @inheritDoc
 */
os.interaction.KeyboardPan.prototype.is3DSupported = function() {
  return false;
};


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides the direction to pan to (if an arrow key was
 * pressed).
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.KeyboardPan
 *
 * @suppress {accessControls|duplicate}
 */
ol.interaction.KeyboardPan.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;

  // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN) {
    this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
  }

  // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
  if (mapBrowserEvent.type == os.ui.ol.interaction.KEY_TYPE) {
    var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

    if (this.condition_(mapBrowserEvent) &&
        (keyCode == ol.events.KeyCode.DOWN ||
        keyCode == ol.events.KeyCode.LEFT ||
        keyCode == ol.events.KeyCode.RIGHT ||
        keyCode == ol.events.KeyCode.UP)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      var mapUnitsDelta = view.getResolution() * this.pixelDelta_;
      var deltaX = 0;
      var deltaY = 0;
      if (keyCode == ol.events.KeyCode.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == ol.events.KeyCode.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == ol.events.KeyCode.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      ol.coordinate.rotate(delta, view.getRotation());
      ol.interaction.Interaction.pan(view, delta, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
