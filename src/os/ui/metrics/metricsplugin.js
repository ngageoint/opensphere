goog.module('os.ui.metrics.MetricsPlugin');

const Disposable = goog.require('goog.Disposable');
const dispose = goog.require('goog.dispose');
const MetricNode = goog.require('os.ui.metrics.MetricNode');

const MetricNodeOptions = goog.requireType('os.ui.metrics.MetricNodeOptions');
const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Base class for adding a metrics node to the application. Extending classes should at minimum set a new label and
 * the UI. Register the plugin using:
 *
 * <pre>
 *   os.ui.metrics.MetricsManager.getInstance().addMetricsPlugin(new my.metrics.Plugin());
 * </pre>
 */
class MetricsPlugin extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The leaf node for this plugin in the metrics tree.
     * @type {?MetricNode}
     * @protected
     */
    this.treeLeaf = null;

    /**
     * The user-facing label for the node.
     * @type {string}
     * @protected
     */
    this.label = 'Change Me!';

    /**
     * An array of parent node labels in the metrics tree.
     * @type {!Array<string>}
     * @protected
     */
    this.categories = [];

    /**
     * The user-facing description, used for the node tooltip.
     * @type {string}
     * @protected
     */
    this.description = '';

    /**
     * Tags used for searching metrics.
     * @type {!Array<string>}
     * @protected
     */
    this.tags = [];

    /**
     * The icon used by the tree node.
     * @type {?string}
     * @protected
     */
    this.icon = '';

    /**
     * Initial collapsed state of this tree node.
     * @type {boolean}
     */
    this.collapsed = false;

    /**
     * The metrics UI.
     * @type {?string}
     * @protected
     */
    this.ui = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.treeLeaf);
    this.treeLeaf = null;
  }

  /**
   * Get the plugin identifier used by the metrics manager. The default behavior is intended to prevent adding metrics
   * nodes with a duplicate tree path.
   *
   * @return {string}
   */
  getId() {
    var id = (this.categories.length > 0 ? (this.categories.join('.') + '.') : '') + this.label;
    return id.replace(' ', '_').toLowerCase();
  }

  /**
   * Get the tree node for this model.
   *
   * @return {!MetricNode}
   */
  getLeafNode() {
    if (!this.treeLeaf) {
      this.treeLeaf = new MetricNode();
      this.treeLeaf.collapsed = this.collapsed;
      this.treeLeaf.icon = this.icon;
      this.treeLeaf.setLabel(this.getLabel());
      this.treeLeaf.setDescription(this.getDescription());
      this.treeLeaf.setCheckboxVisible(false);
    }

    return this.treeLeaf;
  }

  /**
   * Get the categories for the node. Categories define the parent node names in the metrics tree.
   *
   * @return {!Array<string>}
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Set the categories for the node.
   *
   * @param {!Array<string>} categories
   */
  setCategories(categories) {
    this.categories = categories;
  }

  /**
   * Get the description for this model;
   *
   * @return {string}
   */
  getDescription() {
    return this.description;
  }

  /**
   * Set a basic description for the metrics, will be use as a tool tip and possible as a search string.
   *
   * @param {string} description
   */
  setDescription(description) {
    this.description = description;
  }

  /**
   * Set collapsed state of node.
   *
   * @param {boolean} collapsed
   */
  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    if (this.treeLeaf) {
      this.treeLeaf.collapsed = this.collapsed;
    }
  }

  /**
   *
   * @return {string}
   */
  getIcon() {
    return this.icon || MetricsPlugin.DEFAULT_ICON;
  }

  /**
   *
   * @param {string} iconData
   * @param {boolean=} opt_isHtml The icon is full html else the icon is style classes.
   */
  setIcon(iconData, opt_isHtml) {
    if (opt_isHtml) {
      this.icon = iconData;
    } else {
      this.icon = ['<i class="', iconData, '"></i> '].join('');
    }

    if (this.treeLeaf) {
      this.treeLeaf.icon = this.icon;
    }
  }

  /**
   * Get the user-facing label to be used in the metrics tree.
   *
   * @return {string}
   */
  getLabel() {
    return this.label;
  }

  /**
   * Set the user-facing label to be used in the metrics tree.
   *
   * @param {string} label
   */
  setLabel(label) {
    this.label = label;
  }

  /**
   * Return the set of tags for search
   *
   * @return {!Array<string>}
   */
  getTags() {
    return this.tags;
  }

  /**
   * Set the search tags so that this metrics can be singled out using search-- not used at this time
   *
   * @param {!Array<string>} tags
   */
  setTags(tags) {
    this.tags = tags;
  }

  /**
   * Get the html to be used for the ui for this metrics.
   *
   * @return {?string}
   */
  getUI() {
    return this.ui;
  }

  /**
   * Set the ui for the left side of the metrics window.
   * This the user control ui.
   *
   * @param {string} ui
   */
  setUI(ui) {
    this.ui = ui;
  }

  /**
   * Select the first leaf node in the tree.
   *
   * @param {!SlickTreeNode} parent
   * @param {!MetricNodeOptions} options
   * @return {!SlickTreeNode} returns new node that was created
   */
  addChild(parent, options) {
    var newNode = new MetricNode(options.key);
    newNode.setLabel(options.label);
    newNode.setDescription(options.description);
    newNode.collapsed = options.collapsed || false;
    newNode.icon = options.icon || null;
    parent.addChild(newNode);

    return newNode;
  }

  /**
   * Configure/add metrics nodes.
   *
   * @param {!SlickTreeNode} parent
   * @param {!Array<!MetricNodeOptions>} options
   */
  addChildren(parent, options) {
    parent.collapsed = true;
    for (var i = 0; i < options.length; i++) {
      this.addChild(parent, options[i]);
    }
  }
}

/**
 * The default icon for metrics nodes.
 * @type {string}
 * @const
 */
MetricsPlugin.DEFAULT_ICON = '<i class="fa fa-gear"></i>';

exports = MetricsPlugin;
