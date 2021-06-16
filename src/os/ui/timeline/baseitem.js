goog.module('os.ui.timeline.BaseItem');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');

const ITimelineItem = goog.requireType('os.ui.timeline.ITimelineItem');


/**
 * Base timeline item
 *
 * @abstract
 * @implements {ITimelineItem}
 */
class BaseItem extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(id) {
    this.id_ = id;
  }

  /**
   * @inheritDoc
   */
  isInteractive() {
    return this.interactive_;
  }

  /**
   * @inheritDoc
   */
  setInteractive(value) {
    this.interactive_ = value;
  }

  /**
   * Gets the tool tip
   *
   * @return {?string} The tool tip
   */
  getToolTip() {
    return this.tooltip_;
  }

  /**
   * Set the tool tip
   *
   * @param {?string} tip
   */
  setToolTip(tip) {
    this.tooltip_ = tip;
  }

  /**
   * @inheritDoc
   */
  getXScale() {
    return this.xScale;
  }

  /**
   * @inheritDoc
   */
  setXScale(scale) {
    this.xScale = scale;
  }

  /**
   * @inheritDoc
   */
  getActions() {
    return this.actions_;
  }

  /**
   * @inheritDoc
   */
  setActions(value) {
    this.actions_ = value;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  getExtent() {}

  /**
   * @abstract
   * @inheritDoc
   */
  getAvg() {}

  /**
   * @abstract
   * @inheritDoc
   */
  render() {}

  /**
   * @inheritDoc
   */
  setSnap(snap) {
    this.snapFn = snap;
  }

  /**
   * @inheritDoc
   */
  initSVG(container, height) {
  }
}

exports = BaseItem;
