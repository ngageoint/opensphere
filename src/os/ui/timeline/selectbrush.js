goog.provide('os.ui.timeline.SelectBrush');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('os.ui.GlobalMenuCtrl');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.timeline.Brush');



/**
 * Implements shift+click to draw a brush selection
 * @constructor
 * @extends {os.ui.timeline.Brush}
 */
os.ui.timeline.SelectBrush = function() {
  os.ui.timeline.SelectBrush.base(this, 'constructor');
  this.setId('select');
  this.setEventType(os.ui.timeline.Brush.EventType.BRUSH_END);

  /**
   * @type {?string}
   * @private
   */
  this.menuContainer_ = null;

  /**
   * @type {?os.ui.action.ActionManager}
   * @private
   */
  this.am_ = null;

  /**
   * @type {?os.ui.menu.Menu<Array<number>>}
   * @private
   */
  this.menu_ = null;

  /**
   * @type {function(Event):(boolean|undefined)}
   * @private
   */
  this.moveHandler_ = this.onMouseMove_.bind(this);

  /**
   * @type {?Array.<number>}
   * @private
   */
  this.position_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.inEvent_ = false;
};
goog.inherits(os.ui.timeline.SelectBrush, os.ui.timeline.Brush);


/**
 * @param {os.ui.menu.Menu<Array<number>>} menu The menu
 */
os.ui.timeline.SelectBrush.prototype.setMenu = function(menu) {
  this.menu_ = menu;
};


/**
 * @param {os.ui.action.ActionManager} manager The action manager
 */
os.ui.timeline.SelectBrush.prototype.setActionManager = function(manager) {
  this.am_ = manager;
};


/**
 * @param {string} container Menu container
 */
os.ui.timeline.SelectBrush.prototype.setMenuContainer = function(container) {
  this.menuContainer_ = container;
};


/**
 * @inheritDoc
 */
os.ui.timeline.SelectBrush.prototype.initSVG = function(container, height) {
  d3.select('.svg-timeline').
      on(goog.events.EventType.MOUSEDOWN + '.' + this.getId(), this.onDraw_.bind(this), true);
  os.ui.timeline.SelectBrush.superClass_.initSVG.call(this, container, height);
};


/**
 * Begins drawing the selection
 * @return {boolean|undefined}
 * @private
 */
os.ui.timeline.SelectBrush.prototype.onDraw_ = function() {
  var evt = /** @type {MouseEvent} */ (d3.event);

  if (evt.shiftKey && !this.inEvent_) {
    this.inEvent_ = true;
    this.dispatchEvent(goog.events.EventType.DRAGSTART);
    // start brush
    try {
      // modern browsers
      var event = new MouseEvent(evt.type, /** @type {MouseEventInit} */ (evt));
    } catch (e) {
      // IE
      event = document.createEvent('MouseEvents');
      event.initMouseEvent(evt.type, true, true, evt.view, evt.detail, evt.screenX, evt.screenY, evt.clientX,
          evt.clientY, evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.button, evt.relatedTarget);
    }

    d3.select('.brush-' + this.getId()).select('.background').node().dispatchEvent(event);

    // track mouse position
    window.addEventListener(goog.events.EventType.MOUSEMOVE, this.moveHandler_, true);

    // kill the original
    d3.event.preventDefault();
    d3.event.stopPropagation();
    this.inEvent_ = false;
    return false;
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.SelectBrush.prototype.onBrushStart = function() {
  os.ui.timeline.SelectBrush.base(this, 'onBrushStart');
  this.resizing = true;
  this.stillValue = this.xScale.invert(d3.mouse(d3.select('.x-axis').node())[0]).getTime();
};


/**
 * @param {Event} event
 * @private
 */
os.ui.timeline.SelectBrush.prototype.onMouseMove_ = function(event) {
  var evt = /** @type {MouseEvent} */ (event);
  this.position_ = [evt.pageX, evt.pageY];
};


/**
 * @inheritDoc
 */
os.ui.timeline.SelectBrush.prototype.updateBrush = function(opt_silent) {
  os.ui.timeline.SelectBrush.superClass_.updateBrush.call(this, opt_silent);

  if (d3.event && d3.event.type == os.ui.timeline.Brush.EventType.BRUSH_END) {
    var ex = this.getExtent();

    if ((this.am_ || this.menu_) && this.menuContainer_ && ex && !this.inEvent_) {
      this.inEvent_ = true;

      window.removeEventListener(goog.events.EventType.MOUSEMOVE, this.moveHandler_, true);

      var fn = /** @type {d3.ScaleFn} */ (this.xScale);

      var pos = {
        x: this.position_ ? this.position_[0] : fn(ex[1]),
        y: this.position_ ? this.position_[1] : 75
      };

      var target = '.svg-timeline';

      if (this.menu_) {
        this.menu_.open(ex, {
          my: 'left top',
          at: 'left+' + pos.x + ' top+' + pos.y,
          of: target
        });
      } else if (this.am_) {
        this.am_.withActionArgs(ex);
        os.ui.openMenu(this.am_, pos, this.position_ ? undefined : target);
      }

      os.dispatcher.listen(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuEnd_, false, this);

      this.position_ = null;
      this.inEvent_ = false;

      d3.select('.brush-' + this.getId()).select('.background').style('display', 'none');
    }
  }
};


/**
 * Handles menu close
 * @private
 */
os.ui.timeline.SelectBrush.prototype.onMenuEnd_ = function() {
  this.inEvent_ = true;
  this.setExtent(null);
  this.dispatchEvent(goog.events.EventType.EXIT);
  this.inEvent_ = false;
};


/**
 * @inheritDoc
 */
os.ui.timeline.SelectBrush.prototype.updateLabels = function() {
  if (this.mouseDown) {
    os.ui.timeline.SelectBrush.base(this, 'updateLabels');
  } else {
    d3.select('.brush-' + this.getId()).selectAll('text').style('display', 'none');
  }
};
