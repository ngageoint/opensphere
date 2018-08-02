goog.provide('os.structs.TreeNode');

goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.ITreeNode');



/**
 * The base implementation of a tree node
 * @extends {goog.events.EventTarget}
 * @implements {os.structs.ITreeNode}
 * @constructor
 */
os.structs.TreeNode = function() {
  os.structs.TreeNode.base(this, 'constructor');

  /**
   * The node ID
   * @type {string}
   * @private
   */
  this.id_ = '';

  this.setId(os.structs.TreeNode.nodeId_.toString());
  os.structs.TreeNode.nodeId_++;

  /**
   * The node label
   * @type {?string}
   * @private
   */
  this.label_ = null;

  /**
   * The node's parent
   * @type {?os.structs.ITreeNode}
   * @private
   */
  this.parent_ = null;

  /**
   * The node's children
   * @type {?Array<!os.structs.ITreeNode>}
   * @private
   */
  this.children_ = null;

  /**
   * @type {Object<string, !os.structs.ITreeNode>}
   * @protected
   */
  this.childIdMap = {};
};
goog.inherits(os.structs.TreeNode, goog.events.EventTarget);


/**
 * The node ID counter
 * @type {number}
 * @private
 */
os.structs.TreeNode.nodeId_ = 0;


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.disposeInternal = function() {
  // clean up listeners first so events aren't handled on disposed tree nodes
  os.structs.TreeNode.superClass_.disposeInternal.call(this);

  if (this.children_) {
    for (var i = 0, n = this.children_.length; i < n; i++) {
      var c = this.children_[i];
      this.destroyChild(c);
      c.dispose();
    }

    this.children_ = null;
  }
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.getLabel = function() {
  return this.label_;
};


/**
 * Sets the label
 * @param {?string} value The new label
 */
os.structs.TreeNode.prototype.setLabel = function(value) {
  if (value !== this.label_) {
    var old = this.label_;
    this.label_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('label', value, old));
  }
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.getChildren = function() {
  return this.children_;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.setChildren = function(value, opt_skipaddparent) {
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

    this.dispatchEvent(new os.events.PropertyChangeEvent('children', value, null));
  }
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.getParent = function() {
  return this.parent_;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.setParent = function(value, opt_nocheckparent) {
  if (this.parent_ !== value) {
    this.parent_ = value;

    if (this.parent_ && !opt_nocheckparent) {
      this.parent_.addChild(this, true, 0);
    }
  }
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.getRoot = function() {
  var node = this;
  while (node.getParent()) {
    node = node.getParent();
  }

  return node;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.addChild = function(child, opt_skipaddparent, opt_index) {
  if (!this.children_) {
    this.children_ = [];
  }

  if (!this.hasChild(child)) {
    // insert at the specified index, or at the end if unspecified
    var index = opt_index != null ? opt_index : this.children_.length;
    goog.array.insertAt(this.children_, child, index);

    this.initChild(child);

    if (!opt_skipaddparent) {
      child.setParent(this, true);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('children', this.children_));
    return child;
  }

  return null;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.addChildren = function(value, opt_skipaddparent) {
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
      this.dispatchEvent(new os.events.PropertyChangeEvent('children', this.children_));
    }
  }

  return added;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.hasChild = function(child) {
  return child.getId() in this.childIdMap;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.hasChildren = function() {
  return this.children_ != null && this.children_.length > 0;
};


/**
 * @param {!os.structs.ITreeNode} child
 * @protected
 */
os.structs.TreeNode.prototype.index = function(child) {
  this.childIdMap[child.getId()] = child;
};


/**
 * @param {!os.structs.ITreeNode} child
 * @protected
 */
os.structs.TreeNode.prototype.unindex = function(child) {
  delete this.childIdMap[child.getId()];
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.removeChild = function(child) {
  if (this.children_) {
    var index = this.children_.indexOf(child);
    if (index > -1) {
      return this.removeChildInternal(index);
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.removeChildAt = function(index) {
  if (this.children_ && this.children_.length > index) {
    return this.removeChildInternal(index);
  }

  return null;
};


/**
 * Removes a child from the node.
 * @param {number} index The child index to remove
 * @return {!os.structs.ITreeNode} The removed child
 * @protected
 */
os.structs.TreeNode.prototype.removeChildInternal = function(index) {
  var child = this.children_[index];
  if (child.getParent() === this) {
    child.setParent(null);
  }

  this.children_.splice(index, 1);
  this.destroyChild(child);

  if (this.children_.length === 0) {
    this.children_ = null;
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent('children', this.children_));
  return child;
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.find = function(field, value) {
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
};


/**
 * Provides a hook for setup on a child node that is being added.
 * @param {!os.structs.ITreeNode} child The child node
 * @protected
 */
os.structs.TreeNode.prototype.initChild = function(child) {
  this.index(child);
  child.listen(goog.events.EventType.PROPERTYCHANGE, this.onChildChange, false, this);
};


/**
 * Provides a hook for a child node that is being removed
 * @param {!os.structs.ITreeNode} child The child node
 * @protected
 */
os.structs.TreeNode.prototype.destroyChild = function(child) {
  this.unindex(child);
  child.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onChildChange, false, this);
};


/**
 * Handles changes to children
 * @param {!os.events.PropertyChangeEvent} e The change event
 * @protected
 */
os.structs.TreeNode.prototype.onChildChange = function(e) {
  var p = e.getProperty();

  if (p == 'children' || p == 'label') {
    // propagate this up the tree
    this.dispatchEvent(new os.events.PropertyChangeEvent(p));
  }
};


/**
 * @inheritDoc
 */
os.structs.TreeNode.prototype.clone = function() {
  var other = new this.constructor();
  other.updateFrom(this);
  return other;
};


/**
 * Updates this node from the set of properties in the other
 * @param {!os.structs.ITreeNode} other
 * @protected
 */
os.structs.TreeNode.prototype.updateFrom = function(other) {
  this.setId(other.getId());
  this.setLabel(other.getLabel());
};


/**
 * Does this node have the passed in elder (parent, or parent's parent's parent's, etc)
 * @param {!os.structs.ITreeNode} elder
 * @return {boolean} if node has elder
 */
os.structs.TreeNode.prototype.hasElder = function(elder) {
  var parent = this.getParent();
  if (parent && parent == elder) {
    return true;
  } else if (!parent) {
    return false;
  } else {
    // Climb up the parent tree
    return parent.hasElder(elder);
  }
};


/**
 * Get the leaf nodes from a root node.
 * @param {T} root The root node to search
 * @return {!(Array<T>|T)}
 * @template T
 */
os.structs.getLeafNodes = function(root) {
  var children = root.getChildren();
  if (children && children.length > 0) {
    var leaves = [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child) {
        leaves.push(os.structs.getLeafNodes(child));
      }
    }

    return goog.array.flatten(leaves);
  }

  return root;
};
