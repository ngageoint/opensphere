goog.declareModuleId('os.ui.search.FacetNode');

import SlickTreeNode from '../slick/slicktreenode.js';
import {sanitize} from '../ui.js';

const GoogEventType = goog.require('goog.events.EventType');
const TriState = goog.require('os.structs.TriState');

const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');


/**
 * @unrestricted
 */
export default class FacetNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {number}
     * @private
     */
    this.count_ = 0;

    /**
     * @type {string}
     * @private
     */
    this.value_ = '';

    this.listen(GoogEventType.PROPERTYCHANGE, this.onChange, false, this);
  }

  /**
   * @param {PropertyChangeEvent} evt
   * @protected
   */
  onChange(evt) {
    if (evt.getProperty() == 'state') {
      // force a change dispatch on the root
      this.getRoot().dispatchEvent(FacetNode.TYPE);
    }
  }

  /**
   * @return {string}
   */
  getValue() {
    return this.value_;
  }

  /**
   * @param {string} value
   */
  setValue(value) {
    this.value_ = value;
  }

  /**
   * @return {number}
   */
  getCount() {
    return this.count_;
  }

  /**
   * @param {number} value
   */
  setCount(value) {
    this.count_ = value;
    this['count'] = value;
  }

  /**
   * @inheritDoc
   */
  formatValue(value) {
    if (this.parentIndex > -1) {
      value += ' (' + this.getCount() + ')';
    }

    return value;
  }

  /**
   * @inheritDoc
   */
  getCheckboxDisabled() {
    return !this.getCount() || null;
  }

  /**
   * @inheritDoc
   */
  format(row, cell, value) {
    if (value == null) {
      return '';
    }

    var html = this.formatNodeUI();
    html += '<span class="facet';

    if (this.parentIndex === -1) {
      html += ' c-node-toggle';
    }

    html += '" style="left:' + (15 * this.depth + 5) + 'px" ';
    html += 'ng-class="{\'disabled\': item.count === 0}" ng-click="item.toggle($event)">';

    if (this.parentIndex > -1) {
      html += '<i class="fa fa-{{item.state === \'on\' ? \'check-square-o\' : \'square-o\'}}"></i> ';
    }

    html += this.formatValue(sanitize(value));
    html += '</span>';

    return html;
  }

  /**
   * Toggles the state
   *
   * @param {MouseEvent} e the event
   * @export
   */
  toggle(e) {
    if (this.parentIndex > -1) {
      if (!this.getCheckboxDisabled()) {
        this.setState(
            this.getState() == TriState.OFF ? TriState.ON : TriState.OFF);
      }

      e.stopPropagation();
    }
  }
}

/**
 * @type {string}
 * @const
 */
FacetNode.TYPE = 'facet';
