goog.provide('os.ui.timeline.OffArrows');
goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.timeline.BaseItem');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * Displays items that are off of the current timeline view as clickable arrows pointing
 * in the proper direction.
 *
 * @constructor
 * @extends {os.ui.timeline.BaseItem}
 */
os.ui.timeline.OffArrows = function() {
  os.ui.timeline.OffArrows.base(this, 'constructor');

  /**
   * @type {Array.<os.ui.timeline.ITimelineItem>}
   * @private
   */
  this.items_ = [];

  /**
   * @type {number}
   * @private
   */
  this.start_;

  /**
   * @type {number}
   * @private
   */
  this.end_;

  /**
   * @type {Function}
   * @private
   */
  this.clickHandler_ = this.onClick_.bind(this);

  this.setId('offarrows');
};
goog.inherits(os.ui.timeline.OffArrows, os.ui.timeline.BaseItem);


/**
 * @param {Array.<os.ui.timeline.ITimelineItem>} items
 */
os.ui.timeline.OffArrows.prototype.setItems = function(items) {
  this.items_ = items;
};


/**
 * @param {number} t
 */
os.ui.timeline.OffArrows.prototype.setStart = function(t) {
  this.start_ = t;
};


/**
 * @param {number} t
 */
os.ui.timeline.OffArrows.prototype.setEnd = function(t) {
  this.end_ = t;
};


/**
 * @inheritDoc
 */
os.ui.timeline.OffArrows.prototype.initSVG = function(container, height) {
  height = -os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;

  // init left group
  var left = /** @type {d3.Selection} */ (container.append('g'));
  left.attr('transform', 'translate(0, ' + height + ')')
      .attr('class', 'off-left');

  // init right group
  var right = /** @type {d3.Selection} */ (container.append('g'));
  right.attr('class', 'off-right');

  this.init = true;
};


/**
 * @inheritDoc
 */
os.ui.timeline.OffArrows.prototype.render = function(opt_height) {
  var height = -os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;

  if (this.init) {
    var left = d3.select('.off-left');
    var lefts = this.items_.filter(this.filterLeft_, this);
    lefts.sort(os.ui.timeline.OffArrows.compareLeft_);

    var right = d3.select('.off-right');
    var rights = this.items_.filter(this.filterRight_, this);
    rights.sort(os.ui.timeline.OffArrows.compareRight_);

    d3.selectAll('.offarrow').remove();

    this.renderGroup_(left, lefts);
    this.renderGroup_(right, rights);

    var fn = /** @type {d3.ScaleFn} */ (this.xScale);

    // this mess puts it on the right edge
    right.attr('transform', 'translate(' + (fn(this.xScale.domain()[1]) - rights.length * 10) + ', ' +
        height + ') scale(-1,1) translate(' + (-rights.length * 10) + ',0)');
  }
};


/**
 * Renders a group
 * @param {d3.Selection} group
 * @param {Array.<os.ui.timeline.ITimelineItem>} data
 * @private
 */
os.ui.timeline.OffArrows.prototype.renderGroup_ = function(group, data) {
  for (var i = 0, n = data.length; i < n; i++) {
    var item = data[i];
    var g = group.append('g').attr('class', 'offarrow');
    g.append('title').html(os.ui.timeline.OffArrows.getTip_(item));
    g.append('polygon')
        .attr('class', 'arrow-' + item.getId())
        .attr('transform', 'translate(' + (11 * i) + ', 0)')
        .attr('points', '0,5 10,0 10,10')
        .style('cursor', 'pointer')
        .on(goog.events.EventType.CLICK, this.clickHandler_);
  }
};


/**
 * Click handler
 * @private
 */
os.ui.timeline.OffArrows.prototype.onClick_ = function() {
  var id = d3.select(d3.event.target).attr('class');

  if (id) {
    var x = id.indexOf('-');

    if (x > -1) {
      id = id.substring(x + 1);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('zoom', id));
  }
};


/**
 * Filters items down to what is off the left edge
 * @param {os.ui.timeline.ITimelineItem} item
 * @return {boolean} Whether or not the item belongs in the left list
 * @private
 */
os.ui.timeline.OffArrows.prototype.filterLeft_ = function(item) {
  var ex = item.getExtent();

  if (ex && ex.length == 2 && ex[0] !== ex[1]) {
    return ex[0] < this.start_;
  }

  return false;
};


/**
 * Filters items down to what is off the right edge
 * @param {os.ui.timeline.ITimelineItem} item
 * @return {boolean} Whether or not the item belongs in the right list
 * @private
 */
os.ui.timeline.OffArrows.prototype.filterRight_ = function(item) {
  var ex = item.getExtent();

  if (ex && ex.length == 2 && ex[0] !== ex[1]) {
    return ex[1] > this.end_;
  }

  return false;
};


/**
 * Gets the tip
 * @param {os.ui.timeline.ITimelineItem} item
 * @return {string}
 * @private
 */
os.ui.timeline.OffArrows.getTip_ = function(item) {
  var tip = item.getToolTip();
  tip = 'Jump to ' + (tip ? tip.toLowerCase() : 'the ' + item.getId());
  return tip;
};


/**
 * Compares the left side of the extents
 * @param {os.ui.timeline.ITimelineItem} a
 * @param {os.ui.timeline.ITimelineItem} b
 * @return {number} -1, 0, or 1 per normal compare functions
 * @private
 */
os.ui.timeline.OffArrows.compareLeft_ = function(a, b) {
  return goog.array.defaultCompare(a.getExtent()[0], b.getExtent()[0]);
};


/**
 * Compares the right side of the extents
 * @param {os.ui.timeline.ITimelineItem} a
 * @param {os.ui.timeline.ITimelineItem} b
 * @return {number} -1, 0, or 1 per normal compare functions
 * @private
 */
os.ui.timeline.OffArrows.compareRight_ = function(a, b) {
  // this is flipped because we mirror the right group to flip the arrows
  return -1 * goog.array.defaultCompare(a.getExtent()[1], b.getExtent()[1]);
};
