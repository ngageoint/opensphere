goog.provide('os.ui.draw.PolygonControl');
goog.require('goog.events.Event');
goog.require('goog.math.Coordinate');
goog.require('os.ui.draw.AbstractDrawControl');



/**
 * Box drawing control.
 * @param {!SVGSVGElement} owner Owner DOM element.
 * @extends {os.ui.draw.AbstractDrawControl}
 * @constructor
 */
os.ui.draw.PolygonControl = function(owner) {
  os.ui.draw.PolygonControl.base(this, 'constructor', owner);

  /**
   * @type {Array.<goog.math.Coordinate>}
   * @private
   */
  this.coords_ = [];

  /**
   * If the last coordinate is temporary from a mouse move.
   * @type {boolean}
   * @private
   */
  this.hasTempCoord_ = false;

  /**
   * @type {?goog.events.BrowserEvent}
   * @private
   */
  this.lastMouseEvent_ = null;
};
goog.inherits(os.ui.draw.PolygonControl, os.ui.draw.AbstractDrawControl);


/**
 * @inheritDoc
 */
os.ui.draw.PolygonControl.prototype.getElementType = function() {
  return 'polygon';
};


/**
 * @inheritDoc
 */
os.ui.draw.PolygonControl.prototype.activate = function(opt_event) {
  os.ui.draw.PolygonControl.superClass_.activate.call(this, opt_event);

  if (opt_event) {
    // activated via shift+click, so add the initial coordinate
    var event = opt_event.getBrowserEvent();
    event.stopImmediatePropagation();
    event.preventDefault();

    this.onMouseClick_(opt_event);
    goog.events.listen(document, 'dblclick', this.deactivate, true, this);
    goog.events.listen(document, 'mousemove', this.onMouseMove_, true, this);
  }

  // activated via UI, wait for a click
  goog.events.listen(document, 'click', this.onMouseClick_, true, this);
};


/**
 * @inheritDoc
 */
os.ui.draw.PolygonControl.prototype.deactivate = function(opt_event) {
  goog.events.unlisten(document, 'click', this.onMouseClick_, true, this);
  goog.events.unlisten(document, 'dblclick', this.deactivate, true, this);
  goog.events.unlisten(document, 'mousemove', this.onMouseMove_, true, this);

  os.ui.draw.PolygonControl.superClass_.deactivate.call(this, opt_event);
};


/**
 * @inheritDoc
 */
os.ui.draw.PolygonControl.prototype.handleKeyEvent = function(event) {
  switch (event.keyCode) {
    case goog.events.KeyCodes.ENTER:
      if (this.lastMouseEvent_) {
        this.deactivate(this.lastMouseEvent_);
      }
      break;
    default:
      os.ui.draw.PolygonControl.superClass_.handleKeyEvent.call(this, event);
      break;
  }
};


/**
 * @private
 */
os.ui.draw.PolygonControl.prototype.drawMarker_ = function() {
  var points = '';

  // stringify the coordinate list
  goog.array.forEach(this.coords_, function(ele, idx, arr) {
    var coord = /** @type {goog.math.Coordinate} */ (ele);
    points = points.concat(coord.x + ',' + coord.y + ' ');
  });

  // close the polygon
  var start = /** @type {goog.math.Coordinate} */ (this.coords_[0]);
  points = points.concat(start.x + ',' + start.y);

  this.getMarker().setAttribute('points', points);
};


/**
 * @param {goog.events.BrowserEvent} e
 * @private
 */
os.ui.draw.PolygonControl.prototype.onMouseClick_ = function(e) {
  var event = /** @type {MouseEvent} */ (e.getBrowserEvent());
  event.stopImmediatePropagation();
  event.preventDefault();

  // correct for any transform applied to the root svg element
  var point = this.owner.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  point = point.matrixTransform(this.owner.getScreenCTM().inverse());

  var mouseCoord = new goog.math.Coordinate(point.x, point.y);
  this.addCoordinate_(mouseCoord);
  this.hasTempCoord_ = false;
  this.drawMarker_();

  // register listeners when the first coordinate is added
  if (this.coords_.length == 1) {
    goog.events.listen(document, 'dblclick', this.deactivate, true, this);
    goog.events.listen(document, 'mousemove', this.onMouseMove_, true, this);
  }

  this.lastMouseEvent_ = e;
};


/**
 * @param {goog.math.Coordinate} coord
 * @private
 */
os.ui.draw.PolygonControl.prototype.addCoordinate_ = function(coord) {
  if (this.hasTempCoord_) {
    // last coordinate is temporary from a mouse move, so replace it
    this.coords_.splice(this.coords_.length - 1, 1, coord);
  } else {
    // last coordinate is from a click so add a new one
    this.coords_.push(coord);
  }
};


/**
 * Redraws the polygon using the current mouse position.
 * @param {goog.events.BrowserEvent} e The mouse event
 * @private
 */
os.ui.draw.PolygonControl.prototype.onMouseMove_ = function(e) {
  var event = /** @type {MouseEvent} */ (e.getBrowserEvent());
  event.stopImmediatePropagation();
  event.preventDefault();

  // correct for any transform applied to the root svg element
  var point = this.owner.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  point = point.matrixTransform(this.owner.getScreenCTM().inverse());

  var mouseCoord = new goog.math.Coordinate(point.x, point.y);
  this.addCoordinate_(mouseCoord);
  this.hasTempCoord_ = true;
  this.drawMarker_();

  this.lastMouseEvent_ = e;
  this.dispatchEvent(new goog.events.Event(os.ui.draw.EventType.CHANGE));
};


/**
 * @inheritDoc
 */
os.ui.draw.PolygonControl.prototype.contains = function(coord) {
  var contains = false;

  if (this.coords_.length > 2) {
    var i = 0;
    var j = 0;
    var n = this.coords_.length;
    var c = this.coords_;

    // everyone knows Magical Trevor...
    for (i = 0, j = n - 1; i < n; j = i++) {
      if (((c[i].y > coord.y) != (c[j].y > coord.y)) &&
          (coord.x < (c[j].x - c[i].x) * (coord.y - c[i].y) / (c[j].y - c[i].y) + c[i].x)) {
        contains = !contains;
      }
    }
  }

  return contains;
};
