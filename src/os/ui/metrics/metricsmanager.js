goog.provide('os.ui.metrics.MetricsManager');

goog.require('goog.async.Deferred');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsManagerEvent');
goog.require('os.ui.metrics.MetricsManagerEventType');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.TreeSearch');
goog.require('os.ui.window');



/**
 * Base metrics manager. Applications should extend this to fill in the abstract methods.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.metrics.MetricsManager = function() {
  os.ui.metrics.MetricsManager.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.metrics.MetricsManager.LOGGER_;

  /**
   * @type {!Object<string, !os.ui.metrics.MetricsPlugin>}
   * @private
   */
  this.settingsModels_ = {};

  /**
   * @type {?os.structs.ITreeNode}
   * @private
   */
  this.selected_ = null;

  /**
   * A temporary base node to hold the application root
   * @type {!os.ui.slick.SlickTreeNode}
   * @private
   */
  this.topNode_ = new os.ui.slick.SlickTreeNode();

  /**
   * The application root to hold the nodes as they are being built.
   * @type {?os.ui.metrics.MetricNode}
   * @private
   */
  this.root_ = null;
};
goog.inherits(os.ui.metrics.MetricsManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.metrics.MetricsManager);


/**
 * Logger
 * @type {goog.log.Logger}p
 * @private
 * @const
 */
os.ui.metrics.MetricsManager.LOGGER_ = goog.log.getLogger('os.ui.metrics.MetricsManager');


/**
 * Add a metrics control to the system.
 * @param {!os.ui.metrics.MetricsPlugin} plugin
 */
os.ui.metrics.MetricsManager.prototype.addMetricsPlugin = function(plugin) {
  var id = plugin.getId();
  if (!(id in this.settingsModels_)) {
    this.settingsModels_[id] = plugin;
    this.addPluginToTree_(plugin);

    var event = new os.ui.metrics.MetricsManagerEvent(os.ui.metrics.MetricsManagerEventType.METRIC_ADDED, plugin);
    this.dispatchEvent(event);
  }
};


/**
 * Get the metrics tree.
 * @return {!os.structs.ITreeNode}
 */
os.ui.metrics.MetricsManager.prototype.getRootNode = function() {
  return this.topNode_;
};


/**
 * Get the currently selected item.
 * @return {?os.structs.ITreeNode}
 */
os.ui.metrics.MetricsManager.prototype.getSelected = function() {
  return this.selected_;
};


/**
 * Store the last selected item
 * @param {os.structs.ITreeNode} selected
 */
os.ui.metrics.MetricsManager.prototype.setSelected = function(selected) {
  this.selected_ = selected;
};


/**
 * Select a metrics plugin in the tree.
 * @param {string} id The plugin identifier.
 */
os.ui.metrics.MetricsManager.prototype.setSelectedPlugin = function(id) {
  var plugin = this.settingsModels_[id];
  if (plugin) {
    var label = plugin.getLabel();
    var node = this.root_.find('label', label);
    if (node) {
      this.selected_ = node;

      var event = new os.ui.metrics.MetricsManagerEvent(os.ui.metrics.MetricsManagerEventType.METRIC_CHANGE, plugin);
      this.dispatchEvent(event);
    }
  }
};


/**
 * Select the first leaf node in the tree.
 * @return {?os.structs.ITreeNode}
 */
os.ui.metrics.MetricsManager.prototype.initSelection = function() {
  this.setSelected(this.root_);
  return this.root_;
};


/**
 * Export metrics to a json file
 */
os.ui.metrics.MetricsManager.prototype.exportSettings = function() {

};


/**
 * Import metrics
 */
os.ui.metrics.MetricsManager.prototype.importSettings = function() {

};


/**
 * Add a metrics plugin to the tree.
 * @param {!os.ui.metrics.MetricsPlugin} plugin
 * @private
 */
os.ui.metrics.MetricsManager.prototype.addPluginToTree_ = function(plugin) {
  try {
    var leaf = plugin.getLeafNode();
    this.root_.addChild(leaf);

    var children = this.root_.getChildren();
    children.sort(os.ui.slick.TreeSearch.labelCompare);
  } catch (e) {
    // problem?
  }
};


/**
 * Add a metrics plugin to the tree.
 * @param {!string} label
 * @param {!string} description
 */
os.ui.metrics.MetricsManager.prototype.setApplicationNode = function(label, description) {
  if (!this.root_) {
    this.root_ = new os.ui.metrics.MetricNode();
    this.root_.setLabel(label);
    this.root_.setDescription(description);
    this.root_.collapsed = false;
    this.topNode_.addChild(this.root_);
  }
};
