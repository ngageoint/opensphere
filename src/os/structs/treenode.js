goog.module('os.structs.TreeNode');

const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const ISearchable = goog.require('os.data.ISearchable');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osImplements = goog.require('os.implements');
const ITreeNode = goog.require('os.structs.ITreeNode');


/**
 * The base implementation of a tree node
 *
 * @implements {ITreeNode}
 * @unrestricted
 */
class TreeNode extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The node ID
     * @type {string}
     * @private
     */
    this.id_ = '';

    this.setId(nodeId.toString());
    nodeId++;

    /**
     * The node label
     * @type {?string}
     * @private
     */
    this.label_ = null;

    /**
     * The node's parent
     * @type {?ITreeNode}
     * @private
     */
    this.parent_ = null;

    /**
     * The node's children
     * @type {?Array<!ITreeNode>}
     * @private
     */
    this.children_ = null;

    /**
     * @type {Object<string, !ITreeNode>}
     * @protected
     */
    this.childIdMap = {};
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // clean up listeners first so events aren't handled on disposed tree nodes
    super.disposeInternal();

    if (this.children_) {
      for (var i = 0, n = this.children_.length; i < n; i++) {
        var c = this.children_[i];
        this.destroyChild(c);
        c.dispose();
      }

      this.children_ = null;
    }
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
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.label_;
  }

  /**
   * Sets the label
   *
   * @param {?string} value The new label
   */
  setLabel(value) {
    if (value !== this.label_) {
      var old = this.label_;
      this.label_ = value;
      this.dispatchEvent(new PropertyChangeEvent('label', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  getChildren() {
    return this.children_;
  }

  /**
   * @inheritDoc
   */
  setChildren(value, opt_skipaddparent) {
    if (value !== this.children_) {
      if (this.children_) {
        var i = this.children_.length;
        while (i--) {
          this.removeChild(this.children_[i]);
        }
      }

      if (value) {
        for (var i = 0, n = value.length; i < n; i++) {
          this.addChild(value[i], opt_skipaddparent);
        }
      }

      this.dispatchEvent(new PropertyChangeEvent('children', value, null));
    }
  }

  /**
   * @inheritDoc
   */
  getParent() {
    return this.parent_;
  }

  /**
   * @inheritDoc
   */
  setParent(value, opt_nocheckparent) {
    if (this.parent_ !== value) {
      this.parent_ = value;

      if (this.parent_ && !opt_nocheckparent) {
        this.parent_.addChild(this, true, 0);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getRoot() {
    var node = this;
    while (node.getParent()) {
      node = node.getParent();
    }

    return node;
  }

  /**
   * @inheritDoc
   */
  addChild(child, opt_skipaddparent, opt_index) {
    if (!this.children_) {
      this.children_ = [];
    }

    if (!this.hasChild(child)) {
      // insert at the specified index, or at the end if unspecified
      var index = opt_index != null ? opt_index : this.children_.length;
      this.children_.splice(index, 0, child);

      this.initChild(child);

      if (!opt_skipaddparent) {
        child.setParent(this, true);
      }

      this.dispatchEvent(new PropertyChangeEvent('children', this.children_));
      return child;
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  addChildren(value, opt_skipaddparent) {
    var added = [];
    if (value) {
      var changed = false;
      for (var i = 0, n = value.length; i < n; i++) {
        var child = this.addChild(value[i], opt_skipaddparent);
        if (child) {
          changed = true;
        }
      }

      if (changed) {
        this.dispatchEvent(new PropertyChangeEvent('children', this.children_));
      }
    }

    return added;
  }

  /**
   * @inheritDoc
   */
  hasChild(child) {
    return child.getId() in this.childIdMap;
  }

  /**
   * @inheritDoc
   */
  hasChildren() {
    return this.children_ != null && this.children_.length > 0;
  }

  /**
   * @param {!ITreeNode} child
   * @protected
   */
  index(child) {
    this.childIdMap[child.getId()] = child;
  }

  /**
   * @param {!ITreeNode} child
   * @protected
   */
  unindex(child) {
    delete this.childIdMap[child.getId()];
  }

  /**
   * @inheritDoc
   */
  removeChild(child) {
    if (this.children_) {
      var index = this.children_.indexOf(child);
      if (index > -1) {
        return this.removeChildInternal(index);
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  removeChildAt(index) {
    if (this.children_ && this.children_.length > index) {
      return this.removeChildInternal(index);
    }

    return null;
  }

  /**
   * Removes a child from the node.
   *
   * @param {number} index The child index to remove
   * @return {!ITreeNode} The removed child
   * @protected
   */
  removeChildInternal(index) {
    var child = this.children_[index];
    if (child.getParent() === this) {
      child.setParent(null);
    }

    this.children_.splice(index, 1);
    this.destroyChild(child);

    if (this.children_.length === 0) {
      this.children_ = null;
    }

    this.dispatchEvent(new PropertyChangeEvent('children', this.children_));
    return child;
  }

  /**
   * @inheritDoc
   */
  find(field, value) {
    if (field in this && this[field] == value) {
      return this;
    }

    var ret = null;
    if (this.children_) {
      for (var i = 0, n = this.children_.length; i < n; i++) {
        ret = this.children_[i].find(field, value);
        if (ret) {
          return ret;
        }
      }
    }

    return null;
  }

  /**
   * Provides a hook for setup on a child node that is being added.
   *
   * @param {!ITreeNode} child The child node
   * @protected
   */
  initChild(child) {
    this.index(child);
    child.listen(GoogEventType.PROPERTYCHANGE, this.onChildChange, false, this);
  }

  /**
   * Provides a hook for a child node that is being removed
   *
   * @param {!ITreeNode} child The child node
   * @protected
   */
  destroyChild(child) {
    this.unindex(child);
    child.unlisten(GoogEventType.PROPERTYCHANGE, this.onChildChange, false, this);
  }

  /**
   * Handles changes to children
   *
   * @param {!PropertyChangeEvent} e The change event
   * @protected
   */
  onChildChange(e) {
    var p = e.getProperty();

    if (p == 'children' || p == 'label') {
      // propagate this up the tree
      this.dispatchEvent(new PropertyChangeEvent(p));
    }
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    return this.getLabel() || '';
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return null;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = new this.constructor();
    other.updateFrom(this);
    return other;
  }

  /**
   * Updates this node from the set of properties in the other
   *
   * @param {!ITreeNode} other
   * @protected
   */
  updateFrom(other) {
    this.setId(other.getId());
    this.setLabel(other.getLabel());
  }

  /**
   * Does this node have the passed in elder (parent, or parent's parent's parent's, etc)
   *
   * @param {!ITreeNode} elder
   * @return {boolean} if node has elder
   */
  hasElder(elder) {
    var parent = /** @type {TreeNode} */ (this.getParent());
    if (parent && parent == elder) {
      return true;
    } else if (!parent) {
      return false;
    } else {
      // Climb up the parent tree
      return parent.hasElder(elder);
    }
  }
}
osImplements(TreeNode, ISearchable.ID);
osImplements(TreeNode, ITreeNode.ID);

/**
 * The node ID counter
 * @type {number}
 */
let nodeId = 0;

exports = TreeNode;
