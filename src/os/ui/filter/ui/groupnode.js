goog.provide('os.ui.filter.ui.GroupNode');
goog.require('os.ui.filter.ui.GroupNodeUIDirective');
goog.require('os.ui.filter.ui.GroupNodeViewUIDirective');
goog.require('os.ui.nodeToggleFolderDirective');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree node representing a grouping in an advanced filter.
 * @param {boolean=} opt_viewonly
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.filter.ui.GroupNode = function(opt_viewonly) {
  os.ui.filter.ui.GroupNode.base(this, 'constructor');

  /**
   * @type {string}
   */
  this['grouping'] = 'And';
  this.setCheckboxVisible(false);
  if (opt_viewonly) {
    this.nodeUI = '<groupnodeviewui></groupnodeviewui>';
  } else {
    this.nodeUI = '<groupnodeui></groupnodeui>';
  }
  this.collapsed = false;
};
goog.inherits(os.ui.filter.ui.GroupNode, os.ui.slick.SlickTreeNode);


/**
 * @return {string}
 */
os.ui.filter.ui.GroupNode.prototype.getGrouping = function() {
  return this['grouping'];
};


/**
 * @param {string} value
 */
os.ui.filter.ui.GroupNode.prototype.setGrouping = function(value) {
  this['grouping'] = value;
};


/**
 * Depth-first traversal of the filter tree. Writes out this node's grouping around any child nodes.
 * If this group has no children, it will return an empty string.
 * @param {string=} opt_title Optional title to include
 * @param {string=} opt_desc Optional description to include
 * @return {string}
 */
os.ui.filter.ui.GroupNode.prototype.writeFilter = function(opt_title, opt_desc) {
  var children = this.getChildren();
  var ret = '';

  if (children) {
    var group = this['grouping'];

    // encode filter name and description to avoid problems with special chars
    if (opt_title) {
      group += ' namehint="' + os.xml.escape(opt_title) + '"';
    }
    if (opt_desc) {
      group += ' description="' + os.xml.escape(opt_desc) + '"';
    }

    ret = '<' + group + '>';
    for (var i = 0, n = children.length; i < n; i++) {
      ret += children[i].writeFilter();
    }
    ret += '</' + this['grouping'] + '>';
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.GroupNode.prototype.updateFrom = function(other) {
  os.ui.filter.ui.GroupNode.superClass_.updateFrom.call(this, other);
  this.setGrouping(/** @type {os.ui.filter.ui.GroupNode} */ (other).getGrouping());
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.GroupNode.prototype.format = function(row, cell, value) {
  var html = this.getSpacer(19 * this.depth);
  html += '<nodetogglefolder></nodetogglefolder>';
  html += this.formatNodeUI();
  html += '<nodeicons></nodeicons>';
  return html;
};
