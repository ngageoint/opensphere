goog.provide('os.ui.im.action.FilterActionNode');

goog.require('os.im.action.ImportActionManager');
goog.require('os.im.action.default');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.im.action.filterActionNodeUIDirective');



/**
 * Tree node for filter actions.
 *
 * @param {!os.im.action.FilterActionEntry<T>} entry The entry.
 * @extends {os.ui.filter.ui.FilterNode}
 * @constructor
 * @template T
 */
os.ui.im.action.FilterActionNode = function(entry) {
  os.ui.im.action.FilterActionNode.base(this, 'constructor', entry);
  this.checkboxTooltip = 'If the action should automatically execute against loaded data';
  this.defaultIcon = os.im.action.default.ICON;
  this.nodeUI = '<filteractionnodeui></filteractionnodeui>';
  this.bubbleState = false;
  this.bold = false;

  // initialize the children to the entry
  var childEntries = entry.getChildren();
  if (childEntries) {
    var children = [];

    childEntries.forEach(function(childEntry) {
      var node = new os.ui.im.action.FilterActionNode(childEntry);
      children.push(node);
    });

    this.setChildren(children);
  }
};
goog.inherits(os.ui.im.action.FilterActionNode, os.ui.filter.ui.FilterNode);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.generateToolTip = function() {
  var tooltip = os.ui.im.action.FilterActionNode.base(this, 'generateToolTip');

  if (this.entry && this.entry.actions) {
    tooltip += '\nActions: ' + this.entry.actions.map(function(action) {
      return action.getLabel();
    }).join(', ');
  }

  return tooltip;
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.setState = function(value) {
  this.bubbleState = true;
  os.ui.im.action.FilterActionNode.base(this, 'setState', value);
  this.bubbleState = false;

  os.im.action.ImportActionManager.getInstance().save();
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.onChildChange = function(e) {
  if (e.getProperty() == 'state' && e.getNewValue() == os.structs.TriState.ON) {
    this.bubbleState = true;
  }
  os.ui.im.action.FilterActionNode.base(this, 'onChildChange', e);
  this.bubbleState = false;
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.addChild = function(child, opt_skipAddParent, opt_index) {
  this.entry.addChild(child.getEntry());
  return os.ui.im.action.FilterActionNode.base(this, 'addChild', child, opt_skipAddParent, opt_index);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.removeChild = function(child) {
  this.entry.removeChild(child.getEntry());
  return os.ui.im.action.FilterActionNode.base(this, 'removeChild', child);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionNode.prototype.clone = function() {
  return new this.constructor(this.getEntry());
};


/**
 * Translate filter action entries to nodes.
 *
 * @param {Array<!os.im.action.FilterActionEntry>} entries The filter action entries.
 * @return {!Array<!os.ui.im.action.FilterActionNode>} The filter action nodes.
 */
os.ui.im.action.FilterActionNode.fromEntries = function(entries) {
  if (entries) {
    return entries.map(function(entry) {
      return entry ? new os.ui.im.action.FilterActionNode(entry) : undefined;
    }).filter(function(node) {
      return !!node;
    });
  }

  return [];
};


/**
 * Translate filter action nodes to entries.
 *
 * @param {Array<!os.ui.im.action.FilterActionNode>} nodes The filter action nodes.
 * @return {!Array<!os.im.action.FilterActionEntry>} The filter action entries.
 */
os.ui.im.action.FilterActionNode.toEntries = function(nodes) {
  if (nodes) {
    return nodes.map(function(node) {
      return node.getEntry();
    }).filter(function(entry) {
      return !!entry;
    });
  }

  return [];
};
