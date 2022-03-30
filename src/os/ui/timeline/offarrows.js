goog.declareModuleId('os.ui.timeline.OffArrows');

import {extend, createEmpty} from 'ol/src/extent.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import BaseItem from './baseitem.js';
import * as timelineUi from './timeline.js';

const googArray = goog.require('goog.array');
const GoogEventType = goog.require('goog.events.EventType');

const {default: ITimelineItem} = goog.requireType('os.ui.timeline.ITimelineItem');


/**
 * Displays items that are off of the current timeline view as clickable arrows pointing
 * in the proper direction.
 */
export default class OffArrows extends BaseItem {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Array.<ITimelineItem>}
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
  }

  /**
   * @param {Array.<ITimelineItem>} items
   */
  setItems(items) {
    this.items_ = items;
  }

  /**
   * @param {number} t
   */
  setStart(t) {
    this.start_ = t;
  }

  /**
   * @param {number} t
   */
  setEnd(t) {
    this.end_ = t;
  }

  /**
   * @inheritDoc
   */
  initSVG(container, height) {
    height = -timelineUi.getHandleHeight();

    // init left group
    var left = /** @type {d3.Selection} */ (container.append('g'));
    left.attr('transform', 'translate(0, ' + height + ')')
        .attr('class', 'off-left');

    // init right group
    var right = /** @type {d3.Selection} */ (container.append('g'));
    right.attr('class', 'off-right');

    this.init = true;
  }

  /**
   * @inheritDoc
   */
  render(opt_height) {
    var height = -timelineUi.getHandleHeight();

    if (this.init) {
      var left = d3.select('.off-left');
      var lefts = this.items_.filter(this.filterLeft_, this);
      lefts.sort(OffArrows.compareLeft_);

      var right = d3.select('.off-right');
      var rights = this.items_.filter(this.filterRight_, this);
      rights.sort(OffArrows.compareRight_);

      d3.selectAll('.offarrow').remove();

      this.renderGroup_(left, lefts);
      this.renderGroup_(right, rights);

      var fn = /** @type {d3.ScaleFn} */ (this.xScale);

      // this mess puts it on the right edge
      right.attr('transform', 'translate(' + (fn(this.xScale.domain()[1]) - rights.length * 10) + ', ' +
          height + ') scale(-1,1) translate(' + (-rights.length * 10) + ',0)');
    }
  }

  /**
   * Renders a group
   *
   * @param {d3.Selection} group
   * @param {Array.<ITimelineItem>} data
   * @private
   */
  renderGroup_(group, data) {
    for (var i = 0, n = data.length; i < n; i++) {
      var item = data[i];
      var g = group.append('g').attr('class', 'offarrow');
      g.append('title').html(OffArrows.getTip_(item));
      g.append('polygon')
          .attr('class', 'arrow-' + item.getId())
          .attr('transform', 'translate(' + (11 * i) + ', 0)')
          .attr('points', '0,5 10,0 10,10')
          .style('cursor', 'pointer')
          .on(GoogEventType.CLICK, this.clickHandler_);
    }
  }

  /**
   * Click handler
   *
   * @private
   */
  onClick_() {
    var id = d3.select(d3.event.target).attr('class');

    if (id) {
      var x = id.indexOf('-');

      if (x > -1) {
        id = id.substring(x + 1);
      }

      this.dispatchEvent(new PropertyChangeEvent('zoom', id));
    }
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    return this.items_.reduce(function(extent, item) {
      return extend(extent, item.getExtent());
    }, createEmpty());
  }

  /**
   * @inheritDoc
   */
  getAvg() {
    var extent = this.getExtent();
    return (extent[1] - extent[0]) / 2;
  }

  /**
   * Filters items down to what is off the left edge
   *
   * @param {ITimelineItem} item
   * @return {boolean} Whether or not the item belongs in the left list
   * @private
   */
  filterLeft_(item) {
    var ex = item.getExtent();

    if (ex && ex.length == 2 && ex[0] !== ex[1]) {
      return ex[0] < this.start_;
    }

    return false;
  }

  /**
   * Filters items down to what is off the right edge
   *
   * @param {ITimelineItem} item
   * @return {boolean} Whether or not the item belongs in the right list
   * @private
   */
  filterRight_(item) {
    var ex = item.getExtent();

    if (ex && ex.length == 2 && ex[0] !== ex[1]) {
      return ex[1] > this.end_;
    }

    return false;
  }

  /**
   * Gets the tip
   *
   * @param {ITimelineItem} item
   * @return {string}
   * @private
   */
  static getTip_(item) {
    var tip = item.getToolTip();
    tip = 'Jump to ' + (tip ? tip.toLowerCase() : 'the ' + item.getId());
    return tip;
  }

  /**
   * Compares the left side of the extents
   *
   * @param {ITimelineItem} a
   * @param {ITimelineItem} b
   * @return {number} -1, 0, or 1 per normal compare functions
   * @private
   */
  static compareLeft_(a, b) {
    return googArray.defaultCompare(a.getExtent()[0], b.getExtent()[0]);
  }

  /**
   * Compares the right side of the extents
   *
   * @param {ITimelineItem} a
   * @param {ITimelineItem} b
   * @return {number} -1, 0, or 1 per normal compare functions
   * @private
   */
  static compareRight_(a, b) {
    // this is flipped because we mirror the right group to flip the arrows
    return -1 * googArray.defaultCompare(a.getExtent()[1], b.getExtent()[1]);
  }
}
