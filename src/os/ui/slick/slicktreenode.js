goog.provide('os.ui.slick.SlickTreeNode');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriStateTreeNode');
goog.require('os.ui.nodeIconsDirective');
goog.require('os.ui.nodeSpinnerDirective');
goog.require('os.ui.nodeToggleDirective');
goog.require('os.ui.triStateCheckboxDirective');
goog.require('os.ui.windowLauncherDirective');



/**
 * Extends the tri-state tree node to provide items that SlickGrid needs to render the tree
 * @extends {os.structs.TriStateTreeNode}
 * @constructor
 */
os.ui.slick.SlickTreeNode = function() {
  os.ui.slick.SlickTreeNode.base(this, 'constructor');

  /**
   * Whether or not the node is collapsed
   * @type {boolean}
   */
  this.collapsed = true;

  /**
   * Whether or not the collapse state should be saved by tree search. The state will be saved by the value returned
   * by getId, so that value should be unique and consistent for a particular node.
   * @type {boolean}
   */
  this.saveCollapsed = true;

  /**
   * The parent index of the current node after the tree is flattened
   * @type {number}
   */
  this.parentIndex = -1;

  /**
   * The depth of the node
   * @type {number}
   */
  this.depth = 0;

  /**
   * If the node can be dragged within its subtree.
   * @type {boolean}
   */
  this.internalDrag = false;

  /**
   * @type {!string}
   * @private
   */
  this.tooltip_ = '';

  /**
   * @type {!string}
   * @protected
   */
  this.nodeUI = '';

  /**
   * Whether or not the checkbox should be shown for the node
   * @type {boolean}
   * @private
   */
  this.checkboxVisible_ = true;

  /**
   * Whether or not the nodetoggle should be shown for the node
   * @type {boolean}
   * @private
   */
  this.nodetoggleVisible_ = true;

  /**
   * Can this slick tree node have children
   * @type {boolean}
   */
  this.childrenAllowed = true;

  /**
   * The checkbox class that overrides the tree-level checkbox class for this item
   * @type {?string}
   */
  this.checkboxClass = null;

  /**
   * The checkbox tooltip that overrides the tree-level checkbox tooltip for this item
   * @type {?string}
   */
  this.checkboxTooltip = null;

  /**
   * Whether or not the window launcher plus square should be shown for the node
   * @type {boolean}
   */
  this.winLauncherVisible = false;

  /**
   * The class that overrides the tree-level class for this item
   * @type {?string}
   */
  this.winLauncherClass = null;

  /**
   * Bold top level elements
   * @type {boolean}
   */
  this.bold = true;

  /**
   * @type {boolean}
   * @private
   */
  this.disableFolder_ = false;
};
goog.inherits(os.ui.slick.SlickTreeNode, os.structs.TriStateTreeNode);


/**
 * Set the move mode. This lets us push off processing until after the drop event is done
 * @enum {string}
 */
os.ui.slick.SlickTreeNode.MOVE_MODE = {
  SIBLING: 'sibling',
  REPARENT: 'reparent',
  REPARENT_TO_ROOT: 'reparentToRoot',
  REPARENT_LOOKUP_PARENT: 'reparentLookupParent'
};


/**
 * @inheritDoc
 */
os.ui.slick.SlickTreeNode.prototype.setLabel = function(value) {
  os.ui.slick.SlickTreeNode.superClass_.setLabel.call(this, value);
  // SlickGrid requires that 'label' (the column) exists  on the object
  this['label'] = this.getLabel();
};


/**
 * @inheritDoc
 */
os.ui.slick.SlickTreeNode.prototype.setState = function(value) {
  this.setStateInternal(value);
};


/**
 * Sets the state of the node.
 * @param {string} value
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.setStateInternal = function(value) {
  os.ui.slick.SlickTreeNode.superClass_.setState.call(this, value);
  this['state'] = this.getState();
};


/**
 * Gets the tooltip for the node
 * @return {!string} The tooltip
 */
os.ui.slick.SlickTreeNode.prototype.getToolTip = function() {
  return this.tooltip_;
};


/**
 * Sets the tooltip for the node
 * @param {?string} value The tooltip
 */
os.ui.slick.SlickTreeNode.prototype.setToolTip = function(value) {
  this.tooltip_ = value || '';
};


/**
 * Gets the checkbox visibility
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.getCheckboxVisible = function() {
  return this.checkboxVisible_;
};


/**
 * Gets the nodetoggle visibility
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.getNodetoggleVisible = function() {
  return this.nodetoggleVisible_;
};


/**
 * Gets the node UI
 * @return {string}
 */
os.ui.slick.SlickTreeNode.prototype.getNodeUI = function() {
  return this.nodeUI;
};


/**
 * Sets the node UI
 * @param {string} value
 */
os.ui.slick.SlickTreeNode.prototype.setNodeUI = function(value) {
  this.nodeUI = value;
};


/**
 * Sets the visibility of the checkbox for the node
 * @param {boolean} value True to show the checkbox, false otherwise
 */
os.ui.slick.SlickTreeNode.prototype.setCheckboxVisible = function(value) {
  if (value !== this.checkboxVisible_) {
    var old = this.checkboxVisible_;
    this.checkboxVisible_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('checkboxVisible', value, old));
  }
};


/**
 * Sets the visibility of the nodetoggle for the node
 * @param {boolean} value True to show the checkbox, false otherwise
 */
os.ui.slick.SlickTreeNode.prototype.setNodetoggleVisible = function(value) {
  if (value !== this.nodetoggleVisible_) {
    var old = this.nodetoggleVisible_;
    this.nodetoggleVisible_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('nodetoggleVisible', value, old));
  }
};


/**
 * Formats the node
 * @param {number} row The row number
 * @param {number} cell The cell number
 * @param {string} value The value of the cell
 * @return {string} An HTML string for the cell
 */
os.ui.slick.SlickTreeNode.prototype.format = function(row, cell, value) {
  if (!goog.isDefAndNotNull(value)) {
    return '';
  }

  // this should be floated right so it should come first
  var html = this.getSpacer(15 * this.depth);

  if (this.nodetoggleVisible_) {
    html += '<nodetoggle></nodetoggle>';
  }

  // add the tri-state checkbox
  if (this.checkboxVisible_) {
    html += this.formatCheckbox();
    html += this.getSpacer();
  }

  if (this.winLauncherVisible) {
    html += this.formatWinLauncher();
    html += this.getSpacer();
  }

  html += '<nodespinner></nodespinner>';
  html += '<nodeicons></nodeicons>';

  html += '<span class="text-truncate u-flex-grow">' + this.formatValue(value) + '</span>';
  html += this.formatNodeUI();
  return html;
};


/**
 * Gets the HTML that supplies the checkbox. The data item/node is
 * supplied on the scope as <code>item</code>.
 * @return {!string} The checkbox HTML
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.formatCheckbox = function() {
  return '<tristatecheckbox></tristatecheckbox>';
};


/**
 * Gets the HTML that supplies the window launcher box. The data item/node is
 * supplied on the scope as <code>item</code>.
 * @return {!string} The launcher box HTML
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.formatWinLauncher = function() {
  return '<windowlauncher></windowlauncher>';
};


/**
 * @param {number=} opt_width The width, defaults to 2
 * @param {string=} opt_unit The units, defaults to px
 * @return {string} A spacer
 */
os.ui.slick.SlickTreeNode.prototype.getSpacer = function(opt_width, opt_unit) {
  if (!goog.isDefAndNotNull(opt_width)) {
    opt_width = 2;
  }

  if (!goog.isDefAndNotNull(opt_unit)) {
    opt_unit = 'px';
  }

  return '<span class="tree-spacer" style="width:' + opt_width + opt_unit + '"></span>';
};


/**
 * Gets the HTML for the value or label
 * @param {string} value The value
 * @return {!string} The label HTML
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.formatValue = function(value) {
  // sanitize the string to remove malicious html with impunity, then strip remaining HTML and replace double quotes
  // with single quotes. this is all intended to prevent the tooltip from closing the DOM title attribute, while still
  // allowing it to retain most of its original formatting.
  var tooltip = os.ui.sanitize(this.getToolTip()).replace(/<.*?>/g, '').replace(/"/g, '\'');
  var s = '<span title="' + tooltip + '">';

  if (this.bold && this.parentIndex == -1) {
    s += '<b>';
  }

  // sanitize this too
  s += os.ui.sanitize(value);

  if (this.bold && this.parentIndex == -1) {
    s += '</b>';
  }

  s += '</span>';
  return s;
};


/**
 * API call to get the HTML for the icons
 * @return {!string} The icon HTML
 */
os.ui.slick.SlickTreeNode.prototype.getIcons = function() {
  return this.formatIcons();
};
goog.exportProperty(
    os.ui.slick.SlickTreeNode.prototype,
    'getIcons',
    os.ui.slick.SlickTreeNode.prototype.getIcons);


/**
 * Create the HTML for the icons
 * @return {!string} The icon HTML
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.formatIcons = function() {
  return '&nbsp;';
};


/**
 * Gets the HTML for the node UI
 * @return {!string} The node UI HTML
 * @protected
 */
os.ui.slick.SlickTreeNode.prototype.formatNodeUI = function() {
  return this.nodeUI;
};


/**
 * Handle mouse entering the node.
 */
os.ui.slick.SlickTreeNode.prototype.onMouseEnter = function() {
  // for use by overriding classes
};


/**
 * Handle mouse leaving the node.
 */
os.ui.slick.SlickTreeNode.prototype.onMouseLeave = function() {
  // for use by overriding classes
};


/**
 * Performs a node action.
 * @param {string} type The action type
 */
os.ui.slick.SlickTreeNode.prototype.performAction = function(type) {
  // for use by overriding classes
};


/**
 * @inheritDoc
 */
os.ui.slick.SlickTreeNode.prototype.updateFrom = function(other) {
  var node = /** @type {os.ui.slick.SlickTreeNode} */ (other);

  this.collapsed = node.collapsed;
  this.setToolTip(node.getToolTip());
  this.setCheckboxVisible(node.getCheckboxVisible());
  this.winLauncherVisible = node.winLauncherVisible;
  this.winLauncherClass = node.winLauncherClass;
  this.checkboxTooltip = node.checkboxTooltip;
  os.ui.slick.SlickTreeNode.superClass_.updateFrom.call(this, other);
};


/**
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.isChildAllowed = function() {
  return this.childrenAllowed;
};


/**
 * @return {number}
 */
os.ui.slick.SlickTreeNode.prototype.getDepth = function() {
  return this.depth;
};


/**
 * If the node allows dragging within its own tree.
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.supportsInternalDrag = function() {
  return this.internalDrag;
};


/**
 * If the node can be dropped on the provided item.
 * @param {os.ui.slick.SlickTreeNode} dropItem The drop target
 * @param {os.ui.slick.SlickTreeNode.MOVE_MODE} moveMode The drag/drop move mode
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.canDropInternal = function(dropItem, moveMode) {
  return false;
};


/**
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.isCollapsed = function() {
  return this.collapsed;
};


/**
 * @param {boolean} value The new collapse value
 * @param {boolean=} opt_recurse If the collapsed state should recurse to children
 */
os.ui.slick.SlickTreeNode.prototype.setCollapsed = function(value, opt_recurse) {
  this.collapsed = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent('collapsed', value, !value));

  if (opt_recurse) {
    var children = this.getChildren();
    if (children) {
      for (var i = 0; i < children.length; i++) {
        children[i].setCollapsed(value, true);
      }
    }
  }
};


/**
 * @return {number}
 */
os.ui.slick.SlickTreeNode.prototype.getParentIndex = function() {
  return this.parentIndex;
};


/**
 * Get whether to override the folder disable on the tree.
 * @return {boolean}
 */
os.ui.slick.SlickTreeNode.prototype.getDisableFolder = function() {
  return this.disableFolder_;
};


/**
 * Set whether to override the folder disable on the tree.
 * @param {boolean} value
 */
os.ui.slick.SlickTreeNode.prototype.setDisableFolder = function(value) {
  this.disableFolder_ = value;
};
