goog.module('os.ui.im.action.FilterActionNode');
goog.module.declareLegacyNamespace();

const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const {ICON} = goog.require('os.im.action.default');
const FilterNode = goog.require('os.ui.filter.ui.FilterNode');
const {directiveTag: nodeUi} = goog.require('os.ui.im.action.FilterActionNodeUI');


/**
 * Tree node for filter actions.
 *
 * @template T
 */
class FilterActionNode extends FilterNode {
  /**
   * Constructor.
   * @param {!os.im.action.FilterActionEntry<T>} entry The entry.
   */
  constructor(entry) {
    super(entry);
    this.checkboxTooltip = 'If the action should automatically execute against loaded data';
    this.defaultIcon = ICON;
    this.nodeUI = `<${nodeUi}></${nodeUi}>`;
    this.bubbleState = false;
    this.bold = false;

    // initialize the children to the entry
    var childEntries = entry.getChildren();
    if (childEntries) {
      var children = [];

      childEntries.forEach(function(childEntry) {
        var node = new FilterActionNode(childEntry);
        children.push(node);
      });

      this.setChildren(children);
    }
  }

  /**
   * @inheritDoc
   */
  generateToolTip() {
    var tooltip = super.generateToolTip();

    if (this.entry && this.entry.actions) {
      tooltip += '\nActions: ' + this.entry.actions.map(function(action) {
        return action.getLabel();
      }).join(', ');
    }

    return tooltip;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    this.bubbleState = true;
    super.setState(value);
    this.bubbleState = false;

    ImportActionManager.getInstance().save();
  }

  /**
   * @inheritDoc
   */
  onChildChange(e) {
    if (e.getProperty() == 'state' && e.getNewValue() == os.structs.TriState.ON) {
      this.bubbleState = true;
    }
    super.onChildChange(e);
    this.bubbleState = false;
  }

  /**
   * @inheritDoc
   */
  addChild(child, opt_skipAddParent, opt_index) {
    this.entry.addChild(child.getEntry());
    return super.addChild(child, opt_skipAddParent, opt_index);
  }

  /**
   * @inheritDoc
   */
  removeChild(child) {
    this.entry.removeChild(child.getEntry());
    return super.removeChild(child);
  }

  /**
   * @inheritDoc
   */
  clone() {
    return new this.constructor(this.getEntry());
  }

  /**
   * Translate filter action entries to nodes.
   *
   * @param {Array<!os.im.action.FilterActionEntry>} entries The filter action entries.
   * @return {!Array<!os.ui.im.action.FilterActionNode>} The filter action nodes.
   */
  static fromEntries(entries) {
    if (entries) {
      return entries.map(function(entry) {
        return entry ? new FilterActionNode(entry) : undefined;
      }).filter(function(node) {
        return !!node;
      });
    }

    return [];
  }

  /**
   * Translate filter action nodes to entries.
   *
   * @param {Array<!os.ui.im.action.FilterActionNode>} nodes The filter action nodes.
   * @return {!Array<!os.im.action.FilterActionEntry>} The filter action entries.
   */
  static toEntries(nodes) {
    if (nodes) {
      return nodes.map(function(node) {
        return node.getEntry();
      }).filter(function(entry) {
        return !!entry;
      });
    }

    return [];
  }
}

exports = FilterActionNode;
