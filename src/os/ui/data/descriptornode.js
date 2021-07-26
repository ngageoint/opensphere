goog.module('os.ui.data.DescriptorNode');
goog.module.declareLegacyNamespace();

const GoogEventType = goog.require('goog.events.EventType');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ActivateDescriptor = goog.require('os.data.ActivateDescriptor');
const DeactivateDescriptor = goog.require('os.data.DeactivateDescriptor');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const TriState = goog.require('os.structs.TriState');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const ISearchable = goog.requireType('os.data.ISearchable');


/**
 * Displays a data descriptor in a tree node
 *
 * @implements {ISearchable}
 */
class DescriptorNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?IDataDescriptor}
     * @private
     */
    this.descriptor_ = null;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var old = this.getState();
    super.setState(value);
    var s = this.getState();

    if (old != s && this.descriptor_) {
      var active = s === TriState.ON;
      if (active !== this.descriptor_.isActive()) {
        var cmd = active ? new ActivateDescriptor(this.descriptor_) :
          new DeactivateDescriptor(this.descriptor_);

        if (!CommandProcessor.getInstance().addCommand(cmd)) {
          super.setState(TriState.OFF);
        }
      }
    }
  }

  /**
   * Gets the data descriptor
   *
   * @return {?IDataDescriptor} The descriptor
   */
  getDescriptor() {
    return this.descriptor_;
  }

  /**
   * Sets the data descriptor
   *
   * @param {!IDataDescriptor} value The descriptor
   */
  setDescriptor(value) {
    if (value !== this.descriptor_) {
      if (this.descriptor_) {
        this.descriptor_.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
      }

      var old = this.descriptor_;
      this.descriptor_ = value;

      this.descriptor_.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
      this.setId(this.descriptor_.getId());
      this.setLabel(this.descriptor_.getTitle());
      this.setToolTip(this.descriptor_.getDescription() || '');
      this.nodeUI = this.descriptor_.getNodeUI();

      this.setState(this.descriptor_.isActive() ? TriState.ON : TriState.OFF);
      this.dispatchEvent(new PropertyChangeEvent('descriptor', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.descriptor_) {
      this.descriptor_.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange_, false, this);
    }

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.descriptor_) {
      return this.descriptor_.getId();
    }

    return super.getId();
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.descriptor_) {
      return this.descriptor_.getTitle();
    }

    return super.getId();
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    return this.descriptor_ ? this.descriptor_.getSearchText() : '';
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.descriptor_ ? this.descriptor_.getTags() : [];
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var s = null;

    if (this.descriptor_) {
      s = this.descriptor_.getIcons();
    }

    if (!s) {
      return super.formatIcons();
    }

    return s;
  }

  /**
   * Whether or not the descriptor (or the items the descriptor has added) is loading
   *
   * @return {boolean}
   * @export
   */
  isLoading() {
    if (this.descriptor_) {
      return this.descriptor_.isLoading();
    }

    return false;
  }

  /**
   * Handles changes on the desriptor
   *
   * @param {PropertyChangeEvent} e The event
   * @private
   */
  onPropertyChange_(e) {
    var p = e.getProperty();

    if (p == 'active') {
      this.setState(this.descriptor_.isActive() ? TriState.ON : TriState.OFF);
    } else if (p == 'loading') {
      this.dispatchEvent(new PropertyChangeEvent('loading', e.getOldValue(), e.getNewValue()));
    } else if (p == 'icons') {
      this.dispatchEvent(new PropertyChangeEvent(p));
    } else if (p == 'title' || p == 'explicitTitle') {
      this.setLabel(this.descriptor_.getTitle());
      this.dispatchEvent(new PropertyChangeEvent('label'));
    }
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setDescriptor(other.getDescriptor());
    super.updateFrom(other);
  }
}

exports = DescriptorNode;
