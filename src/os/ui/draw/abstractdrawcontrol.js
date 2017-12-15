goog.provide('os.ui.draw.AbstractDrawControl');
goog.require('goog.dom');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.KeyHandler');
goog.require('os.ui.draw.EventType');
goog.require('os.ui.draw.IDrawControl');



/**
 * Box drawing control.
 * @param {!SVGSVGElement} owner Owner DOM element.
 * @extends {goog.events.EventTarget}
 * @implements {os.ui.draw.IDrawControl}
 * @constructor
 */
os.ui.draw.AbstractDrawControl = function(owner) {
  os.ui.draw.AbstractDrawControl.base(this, 'constructor');

  /**
   * @type {!SVGSVGElement}
   * @protected
   */
  this.owner = owner;

  /**
   * @type {?SVGElement}
   * @private
   */
  this.marker_ = null;

  /**
   * @type {?goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = null;
};
goog.inherits(os.ui.draw.AbstractDrawControl, goog.events.EventTarget);


/**
 * Handle keyboard events.
 * @param {goog.events.KeyEvent} event
 * @protected
 */
os.ui.draw.AbstractDrawControl.prototype.handleKeyEvent = function(event) {
  switch (event.keyCode) {
    case goog.events.KeyCodes.ESC:
      event.preventDefault();
      this.deactivate(event);
      break;
    default:
      break;
  }
};


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.activate = function(opt_event) {
  if (!this.keyHandler_) {
    this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
    this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent, false, this);
  }
};


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.deactivate = function(opt_event) {
  var event = opt_event ? opt_event.getBrowserEvent() : null;
  if (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  if (this.keyHandler_) {
    this.keyHandler_.unlisten(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent, false, this);
    this.keyHandler_.dispose();
    this.keyHandler_ = null;
  }

  var completeEvent = new goog.events.BrowserEvent(event);
  if (opt_event instanceof goog.events.KeyEvent) {
    completeEvent.type = os.ui.draw.EventType.CANCEL;
  } else {
    completeEvent.type = os.ui.draw.EventType.COMPLETE;
  }

  this.dispatchEvent(completeEvent);
  this.marker_ = null;
};


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.getMarker = function() {
  return this.marker_;
};


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.setMarker = function(marker) {
  this.marker_ = marker;
};


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.getElementType = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.draw.AbstractDrawControl.prototype.contains = goog.abstractMethod;
