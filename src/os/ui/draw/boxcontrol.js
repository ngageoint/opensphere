goog.provide('os.ui.draw.BoxControl');
goog.require('goog.events.Event');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('os.ui.draw.AbstractDrawControl');



/**
 * Box drawing control.
 * @param {!SVGSVGElement} owner Owner DOM element.
 * @extends {os.ui.draw.AbstractDrawControl}
 * @constructor
 */
os.ui.draw.BoxControl = function(owner) {
  os.ui.draw.BoxControl.base(this, 'constructor', owner);

  /**
   * Starting coordinate for the box.
   * @type {goog.math.Coordinate}
   * @private
   */
  this.source_ = new goog.math.Coordinate();
};
goog.inherits(os.ui.draw.BoxControl, os.ui.draw.AbstractDrawControl);


/**
 * @type {string}
 * @const
 */
os.ui.draw.BoxControl.SVG_TYPE = 'rect';


/**
 * @inheritDoc
 */
os.ui.draw.BoxControl.prototype.getElementType = function() {
  return 'rect';
};


/**
 * @inheritDoc
 */
os.ui.draw.BoxControl.prototype.activate = function(opt_event) {
  os.ui.draw.BoxControl.superClass_.activate.call(this, opt_event);

  if (opt_event) {
    var event = opt_event.getBrowserEvent();
    event.stopImmediatePropagation();
    event.preventDefault();

    // make sure the mouse position isn't affected by any svg transforms.
    var point = this.owner.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    point = point.matrixTransform(this.owner.getScreenCTM().inverse());

    this.source_ = new goog.math.Coordinate(point.x, point.y);

    goog.events.listen(document, 'mousemove', this.onMouseMove_, true, this);
    goog.events.listen(document, 'mouseup', this.deactivate, true, this);
  } else {
    goog.events.listenOnce(document, 'mousedown', this.onMouseDown_, true, this);
  }
};


/**
 * @inheritDoc
 */
os.ui.draw.BoxControl.prototype.deactivate = function(opt_event) {
  goog.events.unlisten(document, 'mousedown', this.onMouseDown_, true, this);
  goog.events.unlisten(document, 'mousemove', this.onMouseMove_, true, this);
  goog.events.unlisten(document, 'mouseup', this.deactivate, true, this);

  os.ui.draw.BoxControl.superClass_.deactivate.call(this, opt_event);
};


/**
 * Activates the control when the mouse is depressed.
 * @param {goog.events.BrowserEvent} e The mouse event
 * @private
 */
os.ui.draw.BoxControl.prototype.onMouseDown_ = function(e) {
  this.activate(e);
};


/**
 * Redraws the box using the current mouse position.
 * @param {goog.events.BrowserEvent} e The mouse event
 * @private
 */
os.ui.draw.BoxControl.prototype.onMouseMove_ = function(e) {
  var event = /** @type {MouseEvent} */ (e.getBrowserEvent());
  event.stopImmediatePropagation();
  event.preventDefault();

  // make sure the mouse position isn't affected by any svg transforms.
  var point = this.owner.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  point = point.matrixTransform(this.owner.getScreenCTM().inverse());

  var x = point.x;
  var y = point.y;

  var width = x - this.source_.x;
  var height = y - this.source_.y;
  this.getMarker().setAttribute('width', Math.abs(width));
  this.getMarker().setAttribute('height', Math.abs(height));
  this.getMarker().setAttribute('x', width >= 0 ? this.source_.x : x);
  this.getMarker().setAttribute('y', height >= 0 ? this.source_.y : y);

  this.dispatchEvent(new goog.events.Event(os.ui.draw.EventType.CHANGE));
};


/**
 * @inheritDoc
 */
os.ui.draw.BoxControl.prototype.contains = function(coord) {
  if (this.getMarker()) {
    var bbox = this.getMarker().getBBox();
    if (bbox) {
      var box = new goog.math.Box(bbox.y, bbox.x + bbox.width, bbox.y + bbox.height, bbox.x);
      return box.contains(coord);
    }
  }

  return false;
};
