goog.provide('os.ui.ol.interaction.AbstractDrag');

goog.require('ol');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.events.condition');
goog.require('os.ui.ol.interaction.AbstractDraw');



/**
 * @constructor
 * @extends {os.ui.ol.interaction.AbstractDraw}
 * @param {olx.interaction.PointerOptions=} opt_options
 */
os.ui.ol.interaction.AbstractDrag = function(opt_options) {
  opt_options = opt_options || {};
  opt_options.handleDownEvent = this.handleDownEvent;
  opt_options.handleUpEvent = this.handleUpEvent;
  opt_options.handleDragEvent = this.handleDragEvent;

  os.ui.ol.interaction.AbstractDrag.base(this, 'constructor', opt_options);

  /**
   * @type {ol.Coordinate}
   * @protected
   */
  this.startCoord = null;
};
goog.inherits(os.ui.ol.interaction.AbstractDrag, os.ui.ol.interaction.AbstractDraw);


/**
 * Minimum area to complete the draw interaction, otherwise it will be cancelled.
 * @type {number}
 * @const
 */
os.ui.ol.interaction.AbstractDrag.MIN_AREA = 64;


/**
 * Handle down event
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent
 * @return {boolean} Whether or not to start the drag sequence
 * @protected
 */
os.ui.ol.interaction.AbstractDrag.prototype.handleDownEvent = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (mapBrowserEvent.pointerEvent.button === 0 && this.condition(mapBrowserEvent)) {
    this.begin(mapBrowserEvent);
    this.update(mapBrowserEvent);
    return true;
  } else {
    return false;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.AbstractDrag.prototype.handleDragEvent = function(mapBrowserEvent) {
  if (ol.events.condition.mouseOnly(mapBrowserEvent)) {
    this.update(mapBrowserEvent);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent
 * @return {boolean} Whether or not to stop the drag sequence
 * @protected
 */
os.ui.ol.interaction.AbstractDrag.prototype.handleUpEvent = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  this.update(mapBrowserEvent);

  var deltaX = 0;
  var deltaY = 0;

  if (this.startCoord) {
    var px = this.getMap().getPixelFromCoordinate(this.startCoord);
    var px2 = mapBrowserEvent.pixel;

    deltaX = px2[0] - px[0];
    deltaY = px2[1] - px[1];
  }

  if (deltaX * deltaX + deltaY * deltaY >= os.ui.ol.interaction.AbstractDrag.MIN_AREA) {
    this.end(mapBrowserEvent);
  } else {
    this.cancel();
  }

  return true;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDrag.prototype.begin = function(mapBrowserEvent) {
  os.ui.ol.interaction.AbstractDrag.base(this, 'begin', mapBrowserEvent);
  this.startCoord = mapBrowserEvent.coordinate;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.AbstractDrag.prototype.cleanup = function() {
  os.ui.ol.interaction.AbstractDrag.base(this, 'cleanup');
  this.startCoord = null;
};
