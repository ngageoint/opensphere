goog.provide('os.ui.timeline.Brush');
goog.provide('os.ui.timeline.Brush.EventType');

goog.require('goog.async.Throttle');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.math');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.ui.timeline.BaseItem');
goog.require('os.ui.timeline.DragPanEvent');
goog.require('os.ui.timeline.IDragPanItem');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * @constructor
 * @extends {os.ui.timeline.BaseItem}
 * @implements {os.ui.timeline.ITimelineItem}
 * @implements {os.ui.timeline.IDragPanItem}
 */
os.ui.timeline.Brush = function() {
  os.ui.timeline.Brush.base(this, 'constructor');

  /**
   * @type {d3.brush}
   * @private
   */
  this.brush_ = d3.svg.brush();

  /**
   * @type {?Array.<number>}
   * @private
   */
  this.initExtent_ = null;

  /**
   * @type {string}
   * @private
   */
  this.eventType_ = os.ui.timeline.Brush.EventType.BRUSH;

  /**
   * Throttles the change events
   * @type {goog.async.Throttle}
   * @private
   */
  this.throttle_ = new goog.async.Throttle(this.fireChangeEvent_, 40, this);
  this.setId('window');

  /**
   * @type {boolean}
   * @protected
   */
  this.mouseIn = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.mouseDown = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.dragPan = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.resizing = false;

  /**
   * @type {number}
   * @protected
   */
  this.stillValue = NaN;

  /**
   * @type {boolean}
   * @protected
   */
  this.silentDragPan = false;

  /**
   * Previous start x position of timeline window
   * @type {number}
   * @protected
   */
  this.previousX1 = NaN;

  /**
   * Previous end x position of timeline window
   * @type {number}
   * @protected
   */
  this.previousX2 = NaN;

  /**
   * Previous pan direction
   * @type {?boolean}
   * @protected
   */
  this.previousPan = null;

  /**
   * Previous pan direction
   * @type {boolean}
   * @private
   */
  this.doClamp_ = true;

  /**
  * @type {boolean}
  * @protected
  */
  this.mouseOverDeleteButton = false;

  /**
  * Brush can be deleted
  * @type {boolean}
  */
  this.canDelete = false;

  /**
  * @return {boolean}
  */
  this.drawFlagCheck = goog.functions.TRUE;

  /**
  * @type {boolean}
  */
  this.init = false;

  /**
  * @type {?d3.Selection}
  */
  this.node = null;

  /**
  * @type {boolean}
  */
  this.deleted = false;

  /**
   * @type {string}
   * @private
   */
  this.brushClass_ = 'brush';
};
goog.inherits(os.ui.timeline.Brush, os.ui.timeline.BaseItem);


/**
 * Global brush dragging status flag
 * @type {boolean}
 */
os.ui.timeline.Brush.isDragging = false;


/**
 * @enum {string}
 */
os.ui.timeline.Brush.EventType = {
  BRUSH_START: 'brushstart',
  BRUSH: 'brush',
  BRUSH_END: 'brushend'
};


/**
 * Whether events should be dispatched during drag-to-pan
 * @param {boolean} value
 */
os.ui.timeline.Brush.prototype.setSilentDrag = function(value) {
  this.silentDragPan = value;
};


/**
 * @return {string} The brush event type
 */
os.ui.timeline.Brush.prototype.getEventType = function() {
  return this.eventType_;
};


/**
 * @param {string} type The brush event type
 */
os.ui.timeline.Brush.prototype.setEventType = function(type) {
  this.eventType_ = type;
};


/**
 * @return {boolean} The clamp setting
 */
os.ui.timeline.Brush.prototype.getClamp = function() {
  return this.doClamp_;
};


/**
 * @param {boolean} doClamp changes the clamp setting when the brush is drawn
 */
os.ui.timeline.Brush.prototype.setClamp = function(doClamp) {
  this.doClamp_ = doClamp;
};


/**
 * @param {string} brushClass css class for this brush instance
 */
os.ui.timeline.Brush.prototype.setClass = function(brushClass) {
  this.brushClass_ = brushClass;
};


/**
 * css class for this brush
 * @return {string}
 */
os.ui.timeline.Brush.prototype.getClass = function() {
  return this.brushClass_;
};


/**
 * @inheritDoc
 */
os.ui.timeline.Brush.prototype.getExtent = function() {
  return os.ui.timeline.normalizeExtent(this.brush_.extent() || this.initExtent_);
};


/**
 * @param {Array.<number>} extent
 * @param {boolean=} opt_silent Whether or not to fire the brush change event
 * @param {boolean=} opt_snap Whether or not the given extent should be snapped. Defaults to false.
 */
os.ui.timeline.Brush.prototype.setExtent = function(extent, opt_silent, opt_snap) {
  opt_snap = goog.isDef(opt_snap) ? opt_snap : false;

  var current = this.getExtent();
  if (extent && extent[0] == extent[1]) {
    // set them as slightly different so that the brush doesn't disappear
    extent[1] = extent[0] + 1;
  }

  if (current !== extent && (!current || !extent ||
      !goog.math.nearlyEquals(current[0], extent[0]) || !goog.math.nearlyEquals(current[1], extent[1]))) {
    if (opt_snap) {
      extent = this.snap_(extent);
    }

    // setting the extent does nothing without a scale, which we don't have until init. So we'll also store
    // the extent in this.initExtent_
    this.initExtent_ = extent;

    if (extent) {
      this.brush_.extent(extent);
    } else {
      this.brush_.clear();
    }

    this.render();

    if (!opt_silent) {
      this.updateBrush();
    }

    this.previousExtent = current;
  }
};


/**
 * Sets the extent of this using a range,
 * @param {goog.math.Range} range
 * @param {boolean=} opt_silent Whether or not to fire the brush change event
 * @param {boolean=} opt_snap Whether or not the given extent should be snapped. Defaults to false.
 */
os.ui.timeline.Brush.prototype.setRange = function(range, opt_silent, opt_snap) {
  var extent = [range.start, range.end];
  this.setExtent(extent, opt_silent, opt_snap);
};


/**
 * @inheritDoc
 */
os.ui.timeline.Brush.prototype.getAvg = function() {
  var extent = this.getExtent();
  return (extent[1] + extent[0]) / 2;
};


/**
 * Jumps the brush to the given time
 * @param {number} time
 * @param {boolean=} opt_silent
 */
os.ui.timeline.Brush.prototype.jumpTo = function(time, opt_silent) {
  var extent = this.getExtent();

  if (extent && extent.length == 2) {
    var offset = extent[1] - extent[0];
    var start = time < extent[0] ? time : time - offset;
    var end = start + offset;
    this.setExtent([start, end], opt_silent);
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.Brush.prototype.dragPanTo = function(time) {
  if (!isNaN(this.stillValue) && this.resizing) {
    if (time < this.stillValue) {
      this.setExtent(this.snap_([time, this.stillValue]), this.silentDragPan);
    } else if (time >= this.stillValue) {
      this.setExtent(this.snap_([this.stillValue, time]), this.silentDragPan);
    }
  } else {
    this.jumpTo(time, this.silentDragPan);
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.Brush.prototype.initSVG = function(container, height) {
  if (this.xScale) {
    this.brush_.
        x(this.xScale).
        on(this.eventType_, this.updateBrush.bind(this));

    if (this.initExtent_) {
      this.brush_.extent(this.initExtent_);
    }

    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH + '.always', this.onBrush.bind(this));
    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH_START + '.stoppan', this.onBrushStart.bind(this));
    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH_END + '.cleanup', this.onBrushEnd.bind(this));
  }

  // THIN-6928 turn off clamping on the timeline active window so it can be panned when zoomed out of view
  if (!this.doClamp_) {
    this.brush_['clamp'](false); // true by default
  }

  var group = /** @type {d3.Selection} */ (container.append('g'));
  this.node = group;
  group.attr('class', this.brushClass_ + ' brush-' + this.getId()).
      on(goog.events.EventType.MOUSEENTER, this.onMouseEnter_.bind(this)).
      on(goog.events.EventType.MOUSELEAVE, this.onMouseLeave_.bind(this)).
      on(goog.events.EventType.MOUSEDOWN, this.onMouseDown_.bind(this));


  group.selectAll('rect').attr('height', height + 'px');

  // labels
  group.append('text').
      attr('class', 'label left').
      style('display', 'none').
      attr('y', 13);

  group.append('text').
      attr('class', 'label right').
      style('display', 'none').
      attr('y', 13);

  // create gradients for our fade in/out windows
  var baseSVG = d3.select('svg');

  if (!baseSVG.select('#right-gradient')[0][0]) {
    var gradient = baseSVG.append('svg:defs')
          .append('svg:linearGradient')
      .attr('id', 'right-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
      .attr('spreadMethod', 'pad');

    // Define the gradient colors
    gradient.append('svg:stop')
        .attr('offset', '0%')
        .attr('stop-color', '#24e')
        .attr('stop-opacity', 1);

    gradient.append('svg:stop')
        .attr('offset', '100%')
        .attr('stop-color', '#24e')
        .attr('stop-opacity', 0);

    var gradient2 = baseSVG.append('svg:defs')
      .append('svg:linearGradient')
      .attr('id', 'left-gradient')
      .attr('x1', '100%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '0%')
      .attr('spreadMethod', 'pad');

    // Define the gradient colors
    gradient2.append('svg:stop')
        .attr('offset', '0%')
        .attr('stop-color', '#24e')
        .attr('stop-opacity', 1);

    gradient2.append('svg:stop')
        .attr('offset', '100%')
        .attr('stop-color', '#24e')
        .attr('stop-opacity', 0);
  }

  group.append('rect').
      style('display', 'none').
      style('pointer-events', 'none').
      attr('class', 'fade-right').attr('fill', 'url(#right-gradient)');
  group.append('rect').
      style('display', 'none').
      style('pointer-events', 'none').
      attr('class', 'fade-left').attr('fill', 'url(#left-gradient)');

  // Buttons
  if (this.canDelete) {
    this.addBrushDeleteButton(group);
  }
  // tool tip
  var tip = this.getToolTip();

  if (tip) {
    group.append('title').text(tip);
  }

  this.init = true;
  this.render(height);

  if (this.drawFlagCheck()) { // draw flags
    group.selectAll('.resize').append('polygon').attr('points', '0,0 0,-10 10,-10 10,-4');
    group.select('.resize.w > polygon').attr('transform', 'scale(-1, 1)');
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.Brush.prototype.render = function(opt_height) {
  if (this.init) {
    try {
      // Brushes don't listen for changes on the scale, so this forces it to update.
      this.brush_.extent(this.getExtent());

      var group = d3.select('.brush-' + this.getId());
      group.call(/** @type {Function} */ (this.brush_));

      if (goog.isDef(opt_height)) {
        group.selectAll('rect').attr('height', opt_height + 'px');
      }

      this.updateLabels();
    } catch (ignore) {}
  }
};


/**
 * Snaps the extent via the snap function
 * @param {Array.<number>} extent
 * @return {Array.<number>}
 * @private
 */
os.ui.timeline.Brush.prototype.snap_ = function(extent) {
  if (this.snapFn && extent) {
    return extent.map(this.snapFn);
  }

  return extent;
};


/**
 * Updates the SVG brush. Called when dragging/resizing the brush.
 * @param {boolean=} opt_silent If true, a brush event will not be fired.
 * @protected
 */
os.ui.timeline.Brush.prototype.updateBrush = function(opt_silent) {
  if (!opt_silent) {
    this.throttle_.fire();
  }
};


/**
 * Fires a change event for this brush
 * @private
 */
os.ui.timeline.Brush.prototype.fireChangeEvent_ = function() {
  var newExtent = this.snap_(this.getExtent());
  if (!goog.array.equals(newExtent, this.oldExtent_)) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('extent', newExtent, this.oldExtent_));
    this.oldExtent_ = newExtent;
  }
};


/**
 * Brush start handler
 * @protected
 */
os.ui.timeline.Brush.prototype.onBrushStart = function() {
  d3.event.sourceEvent.stopPropagation();
  os.time.TimelineController.getInstance().stop();
};


/**
 * Mouse enter handler
 * @private
 */
os.ui.timeline.Brush.prototype.onMouseEnter_ = function() {
  this.mouseIn = true;
  this.updateLabels();
};


/**
 * Mouse leave handler
 * @private
 */
os.ui.timeline.Brush.prototype.onMouseLeave_ = function() {
  this.mouseIn = false;
  this.updateLabels();
};


/**
 * Mouse down handler
 * @private
 */
os.ui.timeline.Brush.prototype.onMouseDown_ = function() {
  if (this.mouseOverDeleteButton) {
    this.render();
    return;
  }
  this.mouseDown = true;

  var target = angular.element(d3.event.target).parent().attr('class');
  if (target.indexOf('resize') > -1) {
    this.stillValue = this.getExtent()[target == 'resize e' ? 0 : 1];
  }

  goog.events.listen(window, goog.events.EventType.MOUSEUP, this.onMouseUp_, false, this);
  goog.events.listen(window, goog.events.EventType.MOUSEMOVE, this.onDrag_, false, this);
  this.checkDragPan_(new goog.events.BrowserEvent(d3.event));
  this.updateLabels();
  this.oldExtent_ = this.getExtent();
};


/**
 * Mouse up handler
 * @private
 */
os.ui.timeline.Brush.prototype.onMouseUp_ = function() {
  this.mouseDown = false;
  this.stopDragPan_();
  this.resizing = false;
  goog.events.unlisten(window, goog.events.EventType.MOUSEUP, this.onMouseUp_, false, this);
  goog.events.unlisten(window, goog.events.EventType.MOUSEMOVE, this.onDrag_, false, this);
  this.updateLabels();
};


/**
 * Handles brush events
 * @protected
 */
os.ui.timeline.Brush.prototype.onBrush = function() {
  // this event fires after other events causing a second update
  // that is at a slightly different X position... causing our gradient to bounce around
  if (d3.event) {
    this.resizing = d3.event.mode == 'resize';

    if (this.resizing && !isNaN(this.stillValue)) {
      var point = d3.mouse(d3.select('.x-axis').node());
      this.dragPanTo(this.xScale.invert(point[0]).getTime());
    } else {
      this.setExtent(this.snap_(this.getExtent()), true);
    }
  }
  this.updateLabels();
};


/**
 * Handles brush end events
 */
os.ui.timeline.Brush.prototype.onBrushEnd = function() {
  this.resizing = false;
  this.stillValue = NaN;
};


/**
 * Handles drag events
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.timeline.Brush.prototype.onDrag_ = function(event) {
  if (this.mouseDown) {
    os.ui.timeline.Brush.isDragging = true;
    this.checkDragPan_(event);
  }
};


/**
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.timeline.Brush.prototype.checkDragPan_ = function(event) {
  var limit = this.xScale.range();

  // get the mouse x position relative to the timeline, regardless of the event target
  // restrict it to be greater than 0, certain browsers provide bogus left offset values
  var x = event.clientX - Math.max(angular.element('.svg-timeline').offset().left, 0);
  var left = x < limit[0] + 20;
  var right = x > limit[1] - 20;

  if (left || right) {
    if (!this.dragPan) {
      this.dispatchEvent(new os.ui.timeline.DragPanEvent(os.ui.timeline.DragPanEventType.START, left));
      this.dragPan = true;
    }
  } else if (this.dragPan) {
    this.stopDragPan_();
  }
};


/**
 * Stops drag-to-pan
 * @private
 */
os.ui.timeline.Brush.prototype.stopDragPan_ = function() {
  this.dispatchEvent(os.ui.timeline.DragPanEventType.STOP);
  this.dragPan = false;
  os.ui.timeline.Brush.isDragging = false;
};


/**
 * Updates the labels and fade gradients
 * @protected
 */
os.ui.timeline.Brush.prototype.updateLabels = function() {
  var svg = d3.select('.brush-' + this.getId());
  var ex = this.getExtent();
  var range = new os.time.TimeRange(ex[0], ex[1]);
  var parts = range.toISOString().split(' to ');
  var box = /** @type {SVGElement} */ (svg.select('.extent').node()).getBBox();

  // show a right or left fade gradient on the timeline
  var fadeLeft = svg.selectAll('.fade-left');
  var fadeRight = svg.selectAll('.fade-right');

  if (this.mouseIn || this.mouseDown) {
    svg.select('text.left').text(parts[0]).attr('x', box.x - 5);
    svg.select('text.right').text(parts[1]).attr('x', box.x + box.width + 5);
    svg.selectAll('text').style('display', 'block');
  } else {
    svg.selectAll('text').style('display', 'none');
  }

  if (this.getId() == 'window' && os.time.TimelineController.getInstance().getFade()) {
    var panningRight = null;

    // show the fade gradient when we pan but only if
    // we moved by less than the window width
    if (!isNaN(this.previousX1)) {
      if (this.previousX1 != 0 && Math.abs(box.x / this.previousX1) > 100) {
        // the screen is being resized, just return
        return;
      }
      if (Math.abs(this.previousX1 - box.x) < 5 && Math.abs(this.previousX2 - box.x - box.width) < 5) {
        // keep whatever pan direction we were using, this is too small to mess with
        panningRight = this.previousPan;
      } else if (box.x > (this.previousX1 + 5) || (box.x + box.width) > (this.previousX2 + 5)) {
        // either moved the box to the right or shifted margins of the window to the right
        panningRight = true;
      } else if ((box.x + box.width) < (this.previousX2 - 5) || (this.previousX1 - 5) > box.x) {
        // dragged to the left
        // moved the right extent to the left
        panningRight = false;
      }
    }

    if (!goog.isDefAndNotNull(panningRight)) {
      fadeLeft.style('display', 'none');
      fadeRight.style('display', 'none');
    } else if (panningRight) {
      fadeRight.style('display', 'none');
      fadeLeft.style('display', 'block');
      fadeLeft.style('pointer-events', 'none');
      fadeLeft.attr('x', box.x - box.width);
      fadeLeft.attr('width', box.width);
    } else {
      fadeLeft.style('display', 'none');
      fadeRight.style('display', 'block');
      fadeRight.style('pointer-events', 'none');
      fadeRight.attr('x', box.x + box.width);
      fadeRight.attr('width', box.width);
    }

    this.previousX1 = box.x;
    this.previousX2 = box.x + box.width;
    this.previousPan = panningRight;
  } else {
    fadeLeft.style('display', 'none');
    fadeRight.style('display', 'none');
  }
  this.updateButtons();
};


/**
 * Clears the extent for a brush. This hides it from view.
 */
os.ui.timeline.Brush.prototype.clear = function() {
  this.initExtent_ = null;
  var cl = '.' + this.brushClass_ + ' .brush-' + this.getId();
  d3.select(cl).call(this.brush_.clear());
};


/**
 * Handler for brush delete click.
 */
os.ui.timeline.Brush.prototype.onBrushDeleteButtonUp = function() {
  if (!os.ui.timeline.Brush.isDragging) {
    this.deleteBrush();
  }
};


/**
 * Handler for brush delete click.
 */
os.ui.timeline.Brush.prototype.onBrushDeleteButtonOver = function() {
  this.mouseOverDeleteButton = true;
};


/**
 * Handler for brush delete click.
 */
os.ui.timeline.Brush.prototype.onBrushDeleteButtonOut = function() {
  this.mouseOverDeleteButton = false;
};


/**
 * Updates the button location for this instance.
 */
os.ui.timeline.Brush.prototype.updateButtons = function() {
  var svg = d3.select('.brush-' + this.getId());
  var box = /** @type {SVGElement} */ (svg.node()).getBBox();
  var xPos = (box.width / 2) - 4 + box.x;
  svg.selectAll('.buttons > .button').
      style('display', 'block').
      style('pointer-events', 'auto').
      attr('x', xPos);
};


/**
 * Addes a brush delete button
 * @param {d3.Selection} container
 */
os.ui.timeline.Brush.prototype.addBrushDeleteButton = function(container) {
  var buttongroup = /** @type {d3.Selection} */ (container.append('g'));
  var tip = 'Delete ' + this.getToolTip().toLowerCase();
  buttongroup.attr('class', 'buttons');
  buttongroup.append('title').text(tip);

  buttongroup.append('text').attr('class', 'button fa glyph').
      attr('aria-label', tip).
      attr('role', 'img').
      attr('y', '-1').
      on('mouseup', this.onBrushDeleteButtonUp.bind(this)).
      on('mouseover', this.onBrushDeleteButtonOver.bind(this)).
      on('mouseout', this.onBrushDeleteButtonOut.bind(this)).
      text(''); // this breaks btoa in saveSvgAsPng, so we will strip it out for screen capture
};


/**
 * Retruns the current or last range.
 * @return {?goog.math.Range} The current range or null
 */
os.ui.timeline.Brush.prototype.getRange = function() {
  var extent = this.getExtent();
  if (extent && extent[0] !== extent[1]) {
    return new goog.math.Range(extent[0], extent[1]);
  } else if (this.previousExtent && this.previousExtent[0] !== this.previousExtent[1]) {
    return new goog.math.Range(this.previousExtent[0], this.previousExtent[1]);
  }
  return null;
};


/**
 * deletes and destroys this brush instance
 * @param {boolean=} opt_silent if true, the delete event will not be fired.
 */
os.ui.timeline.Brush.prototype.deleteBrush = function(opt_silent) {
  if (this.node) {
    this.deleted = true;
    // unregister d3 brush events.
    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH + '.always', null);
    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH_START + '.stoppan', null);
    this.brush_.on(os.ui.timeline.Brush.EventType.BRUSH_END + '.cleanup', null);
    if (this.node) {
      this.node.on(goog.events.EventType.MOUSEENTER, null).
          on(goog.events.EventType.MOUSELEAVE, null).
          on(goog.events.EventType.MOUSEDOWN, null);

      this.node.remove();
    }

    this.init = false;
    if (!opt_silent) {
      this.dispatchEvent(new goog.events.Event('deleted', this));
    }
    this.dispose();
  }
};
