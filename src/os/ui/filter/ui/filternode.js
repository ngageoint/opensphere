goog.declareModuleId('os.ui.filter.ui.FilterNode');

import PropertyChangeEvent from '../../../events/propertychangeevent.js';
import {ICON} from '../../../filter/defaultfilter.js';
import TriState from '../../../structs/tristate.js';
import {tagsFromString} from '../../../tag/tag.js';
import SlickTreeNode from '../../slick/slicktreenode.js';
import {toFilterString} from '../filter.js';
import PropertyChange from '../propertychange.js';
import {directiveTag} from './filternodeui.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: ISearchable} = goog.requireType('os.data.ISearchable');
const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 * Tree nodes for filters
 *
 * @implements {ISearchable}
 */
export default class FilterNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {FilterEntry=} opt_entry
   */
  constructor(opt_entry) {
    super();

    /**
     * The icon to display for default filters.
     * @type {string}
     * @protected
     */
    this.defaultIcon = ICON;

    /**
     * @type {?FilterEntry}
     * @protected
     */
    this.entry = null;
    if (opt_entry) {
      this.setEntry(opt_entry);
    }
    this.nodeUI = `<${directiveTag}></${directiveTag}>`;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var old = this.getState();
    super.setState(value);
    var s = this.getState();

    if (old != s && this.entry) {
      var enabled = s === TriState.ON;

      if (s !== TriState.BOTH && this.entry.isEnabled() !== enabled) {
        this.entry.setEnabled(enabled);
      }
    }
  }

  /**
   * @return {?FilterEntry}
   */
  getEntry() {
    return this.entry;
  }

  /**
   * @param {?FilterEntry} value
   */
  setEntry(value) {
    if (value !== this.entry) {
      if (this.entry) {
        this.entry.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      }

      var old = this.entry;
      this.entry = value;

      if (this.entry) {
        this.entry.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
        this.setId(this.entry.getId());
        this.setLabel(this.entry.getTitle());
        this.setState(this.entry.isEnabled() ? TriState.ON : TriState.OFF);
      }

      this.setToolTip(this.generateToolTip());
      this.dispatchEvent(new PropertyChangeEvent('filter', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.entry) {
      this.entry.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      this.entry = null;
    }

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.entry) {
      return this.entry.getId();
    }

    return super.getId();
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.entry) {
      return this.entry.getTitle();
    }

    return super.getLabel();
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    var t = '';

    if (this.entry) {
      t += this.entry.getTitle();
      t += ' ' + this.entry.getDescription();
      t += ' ' + this.entry.type;
      t += ' ' + this.entry.getTags();
    }

    return t;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.entry ? tagsFromString(this.entry.getTags()) : null;
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var icons = super.formatIcons();

    if (this.entry && this.entry.isDefault()) {
      icons += this.defaultIcon;
    }

    return icons;
  }

  /**
   * Generate a tooltip to display when the node is hovered.
   *
   * @return {string} The new tooltip.
   * @protected
   */
  generateToolTip() {
    var tooltip = '';

    if (this.entry) {
      tooltip += 'Description: ' + (this.entry.getDescription() || 'None provided.');
      tooltip += '\nFilter: ' + toFilterString(this.entry.getFilterNode(), 1000);
    }

    return tooltip;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    super.updateFrom(other);
    this.setEntry(/** @type {FilterNode} */ (other).getEntry());
  }

  /**
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onPropertyChange(event) {
    var prop = event.getProperty();

    if (prop == PropertyChange.ENABLED) {
      this.setState(this.entry.isEnabled() ? TriState.ON : TriState.OFF);
    }
  }
}
