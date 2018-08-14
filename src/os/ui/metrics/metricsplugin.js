goog.provide('os.ui.metrics.MetricsPlugin');
goog.require('goog.Disposable');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.metrics.MetricNode');



/**
 * Base class for adding a metrics node to the application. Extending classes should at minimum set a new label and
 * the UI. Register the plugin using:
 *
 * <pre>
 *   os.ui.metrics.MetricsManager.getInstance().addMetricsPlugin(new my.metrics.Plugin());
 * </pre>
 *
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.metrics.MetricsPlugin = function() {
  /**
   * The leaf node for this plugin in the metrics tree.
   * @type {?os.ui.metrics.MetricNode}
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
};
goog.inherits(os.ui.metrics.MetricsPlugin, goog.Disposable);


/**
 * The default icon for metrics nodes.
 * @type {string}
 * @const
 */
os.ui.metrics.MetricsPlugin.DEFAULT_ICON = '<i class="fa fa-gear"></i>';


/**
 * @inheritDoc
 */
os.ui.metrics.MetricsPlugin.prototype.disposeInternal = function() {
  os.ui.metrics.MetricsPlugin.base(this, 'disposeInternal');

  goog.dispose(this.treeLeaf);
  this.treeLeaf = null;
};


/**
 * Get the plugin identifier used by the metrics manager. The default behavior is intended to prevent adding metrics
 * nodes with a duplicate tree path.
 * @return {string}
 */
os.ui.metrics.MetricsPlugin.prototype.getId = function() {
  var id = (this.categories.length > 0 ? (this.categories.join('.') + '.') : '') + this.label;
  return id.replace(' ', '_').toLowerCase();
};


/**
 * Get the tree node for this model.
 * @return {!os.ui.metrics.MetricNode}
 */
os.ui.metrics.MetricsPlugin.prototype.getLeafNode = function() {
  if (!this.treeLeaf) {
    this.treeLeaf = new os.ui.metrics.MetricNode();
    this.treeLeaf.collapsed = this.collapsed;
    this.treeLeaf.icon = this.icon;
    this.treeLeaf.setLabel(this.getLabel());
    this.treeLeaf.setDescription(this.getDescription());
    this.treeLeaf.setCheckboxVisible(false);
  }

  return this.treeLeaf;
};


/**
 * Get the categories for the node. Categories define the parent node names in the metrics tree.
 * @return {!Array<string>}
 */
os.ui.metrics.MetricsPlugin.prototype.getCategories = function() {
  return this.categories;
};


/**
 * Set the categories for the node.
 * @param {!Array<string>} categories
 */
os.ui.metrics.MetricsPlugin.prototype.setCategories = function(categories) {
  this.categories = categories;
};


/**
 * Get the description for this model;
 * @return {string}
 */
os.ui.metrics.MetricsPlugin.prototype.getDescription = function() {
  return this.description;
};


/**
 * Set a basic description for the metrics, will be use as a tool tip and possible as a search string.
 * @param {string} description
 */
os.ui.metrics.MetricsPlugin.prototype.setDescription = function(description) {
  this.description = description;
};


/**
 * Set collapsed state of node.
 * @param {boolean} collapsed
 */
os.ui.metrics.MetricsPlugin.prototype.setCollapsed = function(collapsed) {
  this.collapsed = collapsed;
  if (this.treeLeaf) {
    this.treeLeaf.collapsed = this.collapsed;
  }
};


/**
 *
 * @return {string}
 */
os.ui.metrics.MetricsPlugin.prototype.getIcon = function() {
  return this.icon || os.ui.metrics.MetricsPlugin.DEFAULT_ICON;
};


/**
 *
 * @param {string} iconData
 * @param {boolean=} opt_isHtml The icon is full html else the icon is style classes.
 */
os.ui.metrics.MetricsPlugin.prototype.setIcon = function(iconData, opt_isHtml) {
  if (opt_isHtml) {
    this.icon = iconData;
  } else {
    this.icon = ['<i class="', iconData, '"></i> '].join('');
  }

  if (this.treeLeaf) {
    this.treeLeaf.icon = this.icon;
  }
};


/**
 * Get the user-facing label to be used in the metrics tree.
 * @return {string}
 */
os.ui.metrics.MetricsPlugin.prototype.getLabel = function() {
  return this.label;
};


/**
 * Set the user-facing label to be used in the metrics tree.
 * @param {string} label
 */
os.ui.metrics.MetricsPlugin.prototype.setLabel = function(label) {
  this.label = label;
};


/**
 * Return the set of tags for search
 * @return {!Array<string>}
 */
os.ui.metrics.MetricsPlugin.prototype.getTags = function() {
  return this.tags;
};


/**
 * Set the search tags so that this metrics can be singled out using search-- not used at this time
 * @param {!Array<string>} tags
 */
os.ui.metrics.MetricsPlugin.prototype.setTags = function(tags) {
  this.tags = tags;
};


/**
 * Get the html to be used for the ui for this metrics.
 * @return {?string}
 */
os.ui.metrics.MetricsPlugin.prototype.getUI = function() {
  return this.ui;
};


/**
 * Set the ui for the left side of the metrics window.
 * This the user control ui.
 * @param {string} ui
 */
os.ui.metrics.MetricsPlugin.prototype.setUI = function(ui) {
  this.ui = ui;
};


/**
 * Select the first leaf node in the tree.
 * @param {!os.ui.slick.SlickTreeNode} parent
 * @param {!os.ui.metrics.MetricNodeOptions} options
 * @return {!os.ui.slick.SlickTreeNode} returns new node that was created
 */
os.ui.metrics.MetricsPlugin.prototype.addChild = function(parent, options) {
  var newNode = new os.ui.metrics.MetricNode(options.key);
  newNode.setLabel(options.label);
  newNode.setDescription(options.description);
  newNode.collapsed = options.collapsed || false;
  newNode.icon = options.icon || null;
  parent.addChild(newNode);

  return newNode;
};


/**
 * Configure/add metrics nodes.
 * @param {!os.ui.slick.SlickTreeNode} parent
 * @param {!Array<!os.ui.metrics.MetricNodeOptions>} options
 */
os.ui.metrics.MetricsPlugin.prototype.addChildren = function(parent, options) {
  parent.collapsed = true;
  for (var i = 0; i < options.length; i++) {
    this.addChild(parent, options[i]);
  }
};
