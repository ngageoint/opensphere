goog.provide('os.data.groupby.BaseGroupBy');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('os.data.groupby.INodeGroupBy');
goog.require('os.structs.ITreeNode');
goog.require('os.structs.TreeNode');



/**
 * @implements {os.data.groupby.INodeGroupBy}
 * @extends {goog.Disposable}
 * @constructor
 */
os.data.groupby.BaseGroupBy = function() {
  os.data.groupby.BaseGroupBy.base(this, 'constructor');

  /**
   * @type {Object.<!string, !os.structs.ITreeNode>}
   * @private
   */
  this.groupsById_ = null;

  /**
   * @type {Object.<!string, {found: number, total: number}>}
   * @private
   */
  this.countsById_ = null;
};
goog.inherits(os.data.groupby.BaseGroupBy, goog.Disposable);


/**
 * @inheritDoc
 */
os.data.groupby.BaseGroupBy.prototype.init = function() {
  this.groupsById_ = {};
  this.countsById_ = {};
};


/**
 * @inheritDoc
 */
os.data.groupby.BaseGroupBy.prototype.disposeInternal = function() {
  os.data.groupby.BaseGroupBy.superClass_.disposeInternal.call(this);

  this.groupsById_ = null;
  this.countsById_ = null;
};


/**
 * @inheritDoc
 */
os.data.groupby.BaseGroupBy.prototype.groupBy = function(node, results, opt_doCount, opt_skipClone) {
  if (!goog.isDefAndNotNull(opt_doCount)) {
    opt_doCount = true;
  }

  var ids = this.getGroupIds(node);
  var group;

  if (ids) {
    for (var i = 0, n = ids.length; i < n; i++) {
      var id = ids[i];
      var child = opt_skipClone ? node : node.clone();

      if (id in this.groupsById_) {
        group = this.groupsById_[id];

        if (group) {
          group.addChild(child, opt_skipClone);
        }
      } else {
        group = this.createGroup(child, id);
        this.groupsById_[id] = group;
        group.addChild(child, opt_skipClone);
        results.push(group);
      }

      if (opt_doCount) {
        if (id in this.countsById_) {
          this.countsById_[id].found++;
        } else {
          this.countsById_[id] = {
            found: 1,
            total: 0
          };
        }

        this.updateText(id);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.data.groupby.BaseGroupBy.prototype.count = function(node) {
  var ids = this.getGroupIds(node);

  if (ids) {
    for (var i = 0, n = ids.length; i < n; i++) {
      var id = ids[i];
      if (id in this.countsById_) {
        this.countsById_[id].total++;
      } else {
        this.countsById_[id] = {
          found: 0,
          total: 1
        };
      }

      this.updateText(id);
    }
  }
};


/**
 * Updates the text on the node for the given ID
 * @param {!string} id
 * @protected
 */
os.data.groupby.BaseGroupBy.prototype.updateText = function(id) {
  if (id in this.groupsById_ && id in this.countsById_) {
    var group = this.groupsById_[id];
    var count = this.countsById_[id];

    var label = group.getLabel();
    label = label.replace(/ \(\d+( of \d+)?\)$/, '');
    label += ' (' + count.found + (count.found != count.total ? ' of ' + count.total : '') + ')';
    group.setLabel(label);
  }
};


/**
 * Get the set of group IDs for the given node
 * @param {!os.structs.ITreeNode} node
 * @return {Array.<!string>} The IDs
 * @protected
 */
os.data.groupby.BaseGroupBy.prototype.getGroupIds = function(node) {
  // extending classes should override this
  return null;
};


/**
 * Creates a group from the given node and ID
 * @param {!os.structs.ITreeNode} node
 * @param {!string} id The ID
 * @return {!os.structs.ITreeNode} The group
 * @protected
 */
os.data.groupby.BaseGroupBy.prototype.createGroup = function(node, id) {
  // extending classes should override this
  return new os.structs.TreeNode();
};
