goog.provide('os.ui.timeline.BaseItem');
goog.require('goog.events.EventTarget');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * Base timeline item
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {os.ui.timeline.ITimelineItem}
 */
os.ui.timeline.BaseItem = function() {
  os.ui.timeline.BaseItem.base(this, 'constructor');

  /**
   * @type {string}
   * @private
   */
  this.id_ = '';

  /**
   * @type {?d3.Scale}
   * @protected
   */
  this.xScale = null;

  /**
   * @type {?function(number):number}
   * @protected
   */
  this.snapFn = null;

  /**
   * @type {boolean}
   */
  this.init = false;

  /**
   * @type {?string}
   * @private
   */
  this.tooltip_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.interactive_ = true;

  /**
   * @type {Array<os.ui.action.Action>}
   * @private
   */
  this.actions_ = null;
};
goog.inherits(os.ui.timeline.BaseItem, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.setId = function(id) {
  this.id_ = id;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.isInteractive = function() {
  return this.interactive_;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.setInteractive = function(value) {
  this.interactive_ = value;
};


/**
 * Gets the tool tip
 * @return {?string} The tool tip
 */
os.ui.timeline.BaseItem.prototype.getToolTip = function() {
  return this.tooltip_;
};


/**
 * Set the tool tip
 * @param {?string} tip
 */
os.ui.timeline.BaseItem.prototype.setToolTip = function(tip) {
  this.tooltip_ = tip;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.getXScale = function() {
  return this.xScale;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.setXScale = function(scale) {
  this.xScale = scale;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.getActions = function() {
  return this.actions_;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.setActions = function(value) {
  this.actions_ = value;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.getExtent = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.getAvg = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.render = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.setSnap = function(snap) {
  this.snapFn = snap;
};


/**
 * @inheritDoc
 */
os.ui.timeline.BaseItem.prototype.initSVG = function(container, height) {
};
