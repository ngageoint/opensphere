goog.module('os.structs.TriStateTreeNode');

const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const TreeNode = goog.require('os.structs.TreeNode');
const TriState = goog.require('os.structs.TriState');

const IStateTreeNode = goog.requireType('os.structs.IStateTreeNode');


/**
 * Adds tri-state functionality to the tree nodes
 *
 * @implements {IStateTreeNode}
 */
class TriStateTreeNode extends TreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The node state
     * @type {string}
     * @private
     */
    this.state_ = TriState.OFF;
    this.setState(TriState.OFF);

    /**
     * The counts of different child node types
     * @type {Object<string, number>}
     * @private
     */
    this.counts_ = {};

    this.counts_[TriState.ON] = 0;
    this.counts_[TriState.OFF] = 0;
    this.counts_[TriState.BOTH] = 0;

    /**
     * @type {boolean}
     * @private
     */
    this.updating_ = false;

    /**
     * Whether or not state bubbles up from children
     * @protected
     * @type {boolean}
     */
    this.bubbleState = true;

    /**
     * Whether or not the checkbox should be disabled;
     * @type {?boolean}
     * @private
     */
    this.disabled_ = null;
  }

  /**
   * Whether or not state bubbles up from children
   *
   * @return {boolean}
   */
  getBubbleState() {
    return this.bubbleState;
  }

  /**
   * Whether or not state bubbles up from children
   *
   * @param {boolean} value
   */
  setBubbleState(value) {
    this.bubbleState = value;
  }

  /**
   * @inheritDoc
   */
  getState() {
    return this.state_;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    if (value !== this.state_) {
      var old = this.state_;
      switch (value) {
        case TriState.OFF:
        case TriState.ON:
        case TriState.BOTH:
          this.state_ = value;

          if (this.bubbleState && !this.updating_) {
            this.updateChildren();
          }

          this.dispatchEvent(new PropertyChangeEvent('state', value, old));
          break;
        default:
          break;
      }
    }
  }

  /**
   * Overridden to add state changes in child nodes and update the counts
   *
   * @override
   */
  initChild(child) {
    if (this.bubbleState) {
      this.counts_[/** @type {TriStateTreeNode} */ (child).getState()]++;
      this.updateFromCounts_();
    }

    super.initChild(child);
  }

  /**
   * Overridden to remove state listeners on child nodes and update the counts
   *
   * @override
   */
  destroyChild(child) {
    if (this.bubbleState) {
      this.counts_[/** @type {TriStateTreeNode} */ (child).getState()]--;
      this.updateFromCounts_();
    }

    super.destroyChild(child);
  }

  /**
   * @inheritDoc
   */
  onChildChange(e) {
    if (this.bubbleState && e.getProperty() == 'state' && !this.updating_) {
      this.counts_[/** @type {string} */ (e.getOldValue())]--;
      this.counts_[/** @type {string} */ (e.getNewValue())]++;
      this.updateFromCounts_();
    }

    super.onChildChange(e);
  }

  /**
   * Updates the state from the child state counts
   *
   * @private
   */
  updateFromCounts_() {
    var l = (this.getChildren() || []).length;
    this.updating_ = true;

    if (l > 0) {
      if (this.counts_[TriState.ON] >= l) {
        this.setState(TriState.ON);
      } else if (this.counts_[TriState.OFF] >= l) {
        this.setState(TriState.OFF);
      } else {
        this.setState(TriState.BOTH);
      }
    } else {
      this.setState(TriState.OFF);
    }

    this.updating_ = false;
  }

  /**
   * Updates the children to the current state
   *
   * @protected
   */
  updateChildren() {
    this.updating_ = true;

    if (this.getState() !== TriState.BOTH) {
      var children = this.getChildren();
      var state = this.getState();

      this.counts_[TriState.OFF] = 0;
      this.counts_[TriState.ON] = 0;
      this.counts_[TriState.BOTH] = 0;

      if (children) {
        // THIN-5877: I know this looks like a superfluous change (from for to while), but doing this backwards
        // helps the combo tree a lot since there are some weird rules in that one. Fortunately, this change does
        // not affect other trees
        var i = children.length;
        while (i--) {
          this.updateChild(/** @type {!IStateTreeNode} */ (children[i]), state);
        }

        this.counts_[state] = children.length;
      }
    }

    this.updating_ = false;
  }

  /**
   * Updates the children to the current state
   *
   * @param {!IStateTreeNode} child
   * @param {string} state
   * @protected
   */
  updateChild(child, state) {
    child.setState(state);
  }

  /**
   * Gets whether the checkbox should be disabled for this treenode.
   *
   * @return {?boolean}
   */
  getCheckboxDisabled() {
    return this.disabled_;
  }

  /**
   * Sets whether the checkbox should be disabled for this treenode.
   *
   * @param {?boolean} disabled
   */
  setCheckboxDisabled(disabled) {
    this.disabled_ = disabled;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setState(/** @type {TriStateTreeNode} */ (other).getState());
    super.updateFrom(other);
  }
}

exports = TriStateTreeNode;
