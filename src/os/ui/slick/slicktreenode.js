goog.module('os.ui.slick.SlickTreeNode');
goog.module.declareLegacyNamespace();

const {registerClass} = goog.require('os.classRegistry');
const {NodeClass} = goog.require('os.data');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const TriStateTreeNode = goog.require('os.structs.TriStateTreeNode');
const {sanitize} = goog.require('os.ui');
const {directiveTag: nodeIconsUi} = goog.require('os.ui.NodeIconsUI');
const {directiveTag: nodeSpinnerUi} = goog.require('os.ui.NodeSpinnerUI');
const {Controller: NodeToggleCtrl, directiveTag: nodeToggleUi} = goog.require('os.ui.NodeToggleUI');
const {directiveTag: checkboxUi} = goog.require('os.ui.TriStateCheckboxUI');
const {directiveTag: windowLauncherUi} = goog.require('os.ui.WindowLauncherUI');


/**
 * Extends the tri-state tree node to provide items that SlickGrid needs to render the tree.
 * @unrestricted
 */
class SlickTreeNode extends TriStateTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
     * @type {Object}
     */
    this.icons = {
      'collapsed': NodeToggleCtrl.DEFAULT_COLLAPSED,
      'expanded': NodeToggleCtrl.DEFAULT_EXPANDED
    };

    /**
     * @type {boolean}
     * @private
     */
    this.disableFolder_ = false;
  }

  /**
   * @inheritDoc
   */
  setLabel(value) {
    super.setLabel(value);
    // SlickGrid requires that 'label' (the column) exists  on the object
    this['label'] = this.getLabel();
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    this.setStateInternal(value);
  }

  /**
   * Sets the state of the node.
   *
   * @param {string} value
   * @protected
   */
  setStateInternal(value) {
    super.setState(value);
    this['state'] = this.getState();
  }

  /**
   * Gets the tooltip for the node
   *
   * @return {!string} The tooltip
   */
  getToolTip() {
    return this.tooltip_;
  }

  /**
   * Sets the tooltip for the node
   *
   * @param {?string} value The tooltip
   */
  setToolTip(value) {
    this.tooltip_ = value || '';
  }

  /**
   * Gets the checkbox visibility
   *
   * @return {boolean}
   */
  getCheckboxVisible() {
    return this.checkboxVisible_;
  }

  /**
   * Gets the nodetoggle visibility
   *
   * @return {boolean}
   */
  getNodetoggleVisible() {
    return this.nodetoggleVisible_;
  }

  /**
   * Gets the node UI
   *
   * @return {string}
   */
  getNodeUI() {
    return this.nodeUI;
  }

  /**
   * Sets the node UI
   *
   * @param {string} value
   */
  setNodeUI(value) {
    this.nodeUI = value;
  }

  /**
   * Sets the visibility of the checkbox for the node
   *
   * @param {boolean} value True to show the checkbox, false otherwise
   */
  setCheckboxVisible(value) {
    if (value !== this.checkboxVisible_) {
      var old = this.checkboxVisible_;
      this.checkboxVisible_ = value;
      this.dispatchEvent(new PropertyChangeEvent('checkboxVisible', value, old));
    }
  }

  /**
   * Sets the visibility of the nodetoggle for the node
   *
   * @param {boolean} value True to show the checkbox, false otherwise
   */
  setNodetoggleVisible(value) {
    if (value !== this.nodetoggleVisible_) {
      var old = this.nodetoggleVisible_;
      this.nodetoggleVisible_ = value;
      this.dispatchEvent(new PropertyChangeEvent('nodetoggleVisible', value, old));
    }
  }

  /**
   * Formats the node
   *
   * @param {number} row The row number
   * @param {number} cell The cell number
   * @param {string} value The value of the cell
   * @return {string} An HTML string for the cell
   */
  format(row, cell, value) {
    if (value == null) {
      return '';
    }

    // this should be floated right so it should come first
    var html = this.getSpacer(15 * this.depth);

    if (this.nodetoggleVisible_) {
      html += `<${nodeToggleUi}></${nodeToggleUi}>`;
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

    html += `<${nodeSpinnerUi}></${nodeSpinnerUi}>`;
    html += `<${nodeIconsUi} class="flex-shrink-0"></${nodeIconsUi}>`;

    html += this.formatLabel(value);
    html += this.formatNodeUI();
    return html;
  }

  /**
   * Gets the HTML that supplies the checkbox. The data item/node is
   * supplied on the scope as <code>item</code>.
   *
   * @return {!string} The checkbox HTML
   * @protected
   */
  formatCheckbox() {
    return `<${checkboxUi}></${checkboxUi}>`;
  }

  /**
   * Gets the HTML that supplies the label. The data item/node is
   * supplied on the scope as <code>item</code>.
   *
   * @param {string} value The value of the cell.
   * @return {!string} The label HTML
   * @protected
   */
  formatLabel(value) {
    return '<span class="text-truncate flex-fill">' + this.formatValue(value) + '</span>';
  }

  /**
   * Gets the HTML that supplies the window launcher box. The data item/node is
   * supplied on the scope as <code>item</code>.
   *
   * @return {!string} The launcher box HTML
   * @protected
   */
  formatWinLauncher() {
    return `<${windowLauncherUi}></${windowLauncherUi}>`;
  }

  /**
   * @param {number=} opt_width The width, defaults to 2
   * @param {string=} opt_unit The units, defaults to px
   * @return {string} A spacer
   */
  getSpacer(opt_width, opt_unit) {
    if (opt_width == null) {
      opt_width = 2;
    }

    if (opt_unit == null) {
      opt_unit = 'px';
    }

    return '<span class="c-slick-tree-node__spacer" style="width:' + opt_width + opt_unit + '"></span>';
  }

  /**
   * Gets the HTML for the value or label
   *
   * @param {string} value The value
   * @return {!string} The label HTML
   * @protected
   */
  formatValue(value) {
    // sanitize the string to remove malicious html with impunity, then strip remaining HTML and replace double quotes
    // with single quotes. this is all intended to prevent the tooltip from closing the DOM title attribute, while still
    // allowing it to retain most of its original formatting.
    var tooltip = sanitize(this.getToolTip()).replace(/<.*?>/g, '').replace(/"/g, '\'');
    var s = '<span title="' + tooltip + '">';

    if (this.bold && this.parentIndex == -1) {
      s += '<b>';
    }

    // sanitize this too
    s += sanitize(value);

    if (this.bold && this.parentIndex == -1) {
      s += '</b>';
    }

    s += '</span>';
    return s;
  }

  /**
   * API call to get the HTML for the icons
   *
   * @return {!string} The icon HTML
   * @export
   */
  getIcons() {
    return this.formatIcons();
  }

  /**
   * Create the HTML for the icons
   *
   * @return {!string} The icon HTML
   * @protected
   */
  formatIcons() {
    return '&nbsp;';
  }

  /**
   * API call to get the HTML for the toggle icons
   * Toggle Icons can be: classIcon
   * @return {Object<string, string>} The toggle icons HTML
   * @export
   */
  getToggleIcons() {
    return this.icons;
  }

  /**
   * API call to get the HTML for the toggle icons
   * Toggle Icons can be: classIcon
   * @param {string} collapsed
   * @param {string} expanded
   * @export
   */
  setToggleIcons(collapsed, expanded) {
    this.icons['collapsed'] = collapsed;
    this.icons['expanded'] = expanded;
  }

  /**
   * Gets the HTML for the node UI
   *
   * @return {!string} The node UI HTML
   * @protected
   */
  formatNodeUI() {
    return this.nodeUI;
  }

  /**
   * Handle mouse entering the node.
   */
  onMouseEnter() {
    // for use by overriding classes
  }

  /**
   * Handle mouse leaving the node.
   */
  onMouseLeave() {
    // for use by overriding classes
  }

  /**
   * Performs a node action.
   *
   * @param {string} type The action type
   */
  performAction(type) {
    // for use by overriding classes
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    var node = /** @type {os.ui.slick.SlickTreeNode} */ (other);

    this.nodeUI = node.nodeUI;
    this.collapsed = node.collapsed;
    this.setToolTip(node.getToolTip());
    this.setCheckboxVisible(node.getCheckboxVisible());
    this.winLauncherVisible = node.winLauncherVisible;
    this.winLauncherClass = node.winLauncherClass;
    this.checkboxTooltip = node.checkboxTooltip;
    super.updateFrom(other);
  }

  /**
   * @return {boolean}
   */
  isChildAllowed() {
    return this.childrenAllowed;
  }

  /**
   * @return {number}
   */
  getDepth() {
    return this.depth;
  }

  /**
   * If the node allows dragging within its own tree.
   *
   * @return {boolean}
   */
  supportsInternalDrag() {
    return this.internalDrag;
  }

  /**
   * If the node can be dropped on the provided item.
   *
   * @param {os.ui.slick.SlickTreeNode} dropItem The drop target
   * @param {os.ui.slick.SlickTreeNode.MOVE_MODE} moveMode The drag/drop move mode
   * @return {boolean}
   */
  canDropInternal(dropItem, moveMode) {
    return false;
  }

  /**
   * @return {boolean}
   */
  isCollapsed() {
    return this.collapsed;
  }

  /**
   * @param {boolean} value The new collapse value
   * @param {boolean=} opt_recurse If the collapsed state should recurse to children
   */
  setCollapsed(value, opt_recurse) {
    this.collapsed = value;
    this.dispatchEvent(new PropertyChangeEvent('collapsed', value, !value));

    if (opt_recurse) {
      var children = /** @type {Array<SlickTreeNode>} */ (this.getChildren());
      if (children) {
        for (var i = 0; i < children.length; i++) {
          children[i].setCollapsed(value, true);
        }
      }
    }
  }

  /**
   * @return {number}
   */
  getParentIndex() {
    return this.parentIndex;
  }

  /**
   * Get whether to override the folder disable on the tree.
   *
   * @return {boolean}
   */
  getDisableFolder() {
    return this.disableFolder_;
  }

  /**
   * Set whether to override the folder disable on the tree.
   *
   * @param {boolean} value
   */
  setDisableFolder(value) {
    this.disableFolder_ = value;
  }
}
registerClass(NodeClass.SLICK, SlickTreeNode);


/**
 * Set the move mode. This lets us push off processing until after the drop event is done
 * @enum {string}
 */
SlickTreeNode.MOVE_MODE = {
  SIBLING: 'sibling',
  REPARENT: 'reparent',
  REPARENT_TO_ROOT: 'reparentToRoot',
  REPARENT_LOOKUP_PARENT: 'reparentLookupParent'
};


exports = SlickTreeNode;
