goog.provide('os.structs.TriStateTreeNode');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.IStateTreeNode');
goog.require('os.structs.TreeNode');
goog.require('os.structs.TriState');



/**
 * Adds tri-state functionality to the tree nodes
 * @extends {os.structs.TreeNode}
 * @implements {os.structs.IStateTreeNode}
 * @constructor
 */
os.structs.TriStateTreeNode = function() {
  os.structs.TriStateTreeNode.base(this, 'constructor');

  /**
   * The node state
   * @type {string}
   * @private
   */
  this.state_ = os.structs.TriState.OFF;
  this.setState(os.structs.TriState.OFF);

  /**
   * The counts of different child node types
   * @type {Object.<string, number>}
   * @private
   */
  this.counts_ = {};

  this.counts_[os.structs.TriState.ON] = 0;
  this.counts_[os.structs.TriState.OFF] = 0;
  this.counts_[os.structs.TriState.BOTH] = 0;

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
   * @type {boolean}
   * @private
   */
  this.disabled_ = false;
};
goog.inherits(os.structs.TriStateTreeNode, os.structs.TreeNode);


/**
 * Whether or not state bubbles up from children
 * @return {boolean}
 */
os.structs.TriStateTreeNode.prototype.getBubbleState = function() {
  return this.bubbleState;
};


/**
 * Whether or not state bubbles up from children
 * @param {boolean} value
 */
os.structs.TriStateTreeNode.prototype.setBubbleState = function(value) {
  this.bubbleState = value;
};


/**
 * @inheritDoc
 */
os.structs.TriStateTreeNode.prototype.getState = function() {
  return this.state_;
};


/**
 * @inheritDoc
 */
os.structs.TriStateTreeNode.prototype.setState = function(value) {
  if (value !== this.state_) {
    var old = this.state_;
    switch (value) {
      case os.structs.TriState.OFF:
      case os.structs.TriState.ON:
      case os.structs.TriState.BOTH:
        this.state_ = value;

        if (this.bubbleState && !this.updating_) {
          this.updateChildren();
        }

        this.dispatchEvent(new os.events.PropertyChangeEvent('state', value, old));
        break;
      default:
        break;
    }
  }
};


/**
 * Overridden to add state changes in child nodes and update the counts
 * @override
 */
os.structs.TriStateTreeNode.prototype.initChild = function(child) {
  if (this.bubbleState) {
    this.counts_[child.getState()]++;
    this.updateFromCounts_();
  }

  os.structs.TriStateTreeNode.superClass_.initChild.call(this, child);
};


/**
 * Overridden to remove state listeners on child nodes and update the counts
 * @override
 */
os.structs.TriStateTreeNode.prototype.destroyChild = function(child) {
  if (this.bubbleState) {
    this.counts_[child.getState()]--;
    this.updateFromCounts_();
  }

  os.structs.TriStateTreeNode.superClass_.destroyChild.call(this, child);
};


/**
 * @inheritDoc
 */
os.structs.TriStateTreeNode.prototype.onChildChange = function(e) {
  if (this.bubbleState && e.getProperty() == 'state' && !this.updating_) {
    this.counts_[/** @type {string} */ (e.getOldValue())]--;
    this.counts_[/** @type {string} */ (e.getNewValue())]++;
    this.updateFromCounts_();
  }

  os.structs.TriStateTreeNode.superClass_.onChildChange.call(this, e);
};


/**
 * Updates the state from the child state counts
 * @private
 */
os.structs.TriStateTreeNode.prototype.updateFromCounts_ = function() {
  var l = (this.getChildren() || []).length;
  this.updating_ = true;

  if (l > 0) {
    if (this.counts_[os.structs.TriState.ON] >= l) {
      this.setState(os.structs.TriState.ON);
    } else if (this.counts_[os.structs.TriState.OFF] >= l) {
      this.setState(os.structs.TriState.OFF);
    } else {
      this.setState(os.structs.TriState.BOTH);
    }
  } else {
    this.setState(os.structs.TriState.OFF);
  }

  this.updating_ = false;
};


/**
 * Updates the children to the current state
 * @protected
 */
os.structs.TriStateTreeNode.prototype.updateChildren = function() {
  this.updating_ = true;

  if (this.getState() !== os.structs.TriState.BOTH) {
    var children = this.getChildren();
    var state = this.getState();

    this.counts_[os.structs.TriState.OFF] = 0;
    this.counts_[os.structs.TriState.ON] = 0;
    this.counts_[os.structs.TriState.BOTH] = 0;

    if (children) {
      // THIN-5877: I know this looks like a superfluous change (from for to while), but doing this backwards
      // helps the combo tree a lot since there are some weird rules in that one. Fortunately, this change does
      // not affect other trees
      var i = children.length;
      while (i--) {
        this.updateChild(/** @type {!os.structs.IStateTreeNode} */ (children[i]), state);
      }

      this.counts_[state] = children.length;
    }
  }

  this.updating_ = false;
};


/**
 * Updates the children to the current state
 * @param {!os.structs.IStateTreeNode} child
 * @param {string} state
 * @protected
 */
os.structs.TriStateTreeNode.prototype.updateChild = function(child, state) {
  child.setState(state);
};


/**
 * Gets whether the checkbox should be disabled for this treenode.
 * @return {boolean}
 */
os.structs.TriStateTreeNode.prototype.getCheckboxDisabled = function() {
  return this.disabled_;
};


/**
 * Sets whether the checkbox should be disabled for this treenode.
 * @param {boolean} disabled
 */
os.structs.TriStateTreeNode.prototype.setCheckboxDisabled = function(disabled) {
  this.disabled_ = disabled;
};


/**
 * @inheritDoc
 */
os.structs.TriStateTreeNode.prototype.updateFrom = function(other) {
  this.setState(/** @type {os.structs.TriStateTreeNode} */ (other).getState());
  os.structs.TriStateTreeNode.superClass_.updateFrom.call(this, other);
};
