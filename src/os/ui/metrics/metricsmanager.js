goog.module('os.ui.metrics.MetricsManager');

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const MetricNode = goog.require('os.ui.metrics.MetricNode');
const MetricsManagerEvent = goog.require('os.ui.metrics.MetricsManagerEvent');
const MetricsManagerEventType = goog.require('os.ui.metrics.MetricsManagerEventType');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const TreeSearch = goog.require('os.ui.slick.TreeSearch');
const Logger = goog.requireType('goog.log.Logger');

const ITreeNode = goog.requireType('os.structs.ITreeNode');
const MetricsPlugin = goog.requireType('os.ui.metrics.MetricsPlugin');


/**
 * Base metrics manager. Applications should extend this to fill in the abstract methods.
 */
class MetricsManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {!Object<string, !MetricsPlugin>}
     * @private
     */
    this.settingsModels_ = {};

    /**
     * @type {?ITreeNode}
     * @private
     */
    this.selected_ = null;

    /**
     * A temporary base node to hold the application root
     * @type {!SlickTreeNode}
     * @private
     */
    this.topNode_ = new SlickTreeNode();

    /**
     * The application root to hold the nodes as they are being built.
     * @type {?MetricNode}
     * @private
     */
    this.root_ = null;
  }

  /**
   * Add a metrics control to the system.
   *
   * @param {!MetricsPlugin} plugin
   */
  addMetricsPlugin(plugin) {
    var id = plugin.getId();
    if (!(id in this.settingsModels_)) {
      this.settingsModels_[id] = plugin;
      this.addPluginToTree_(plugin);

      var event = new MetricsManagerEvent(MetricsManagerEventType.METRIC_ADDED, plugin);
      this.dispatchEvent(event);
    }
  }

  /**
   * Get the metrics tree.
   *
   * @return {!ITreeNode}
   */
  getRootNode() {
    return this.topNode_;
  }

  /**
   * Get the currently selected item.
   *
   * @return {?ITreeNode}
   */
  getSelected() {
    return this.selected_;
  }

  /**
   * Store the last selected item
   *
   * @param {ITreeNode} selected
   */
  setSelected(selected) {
    this.selected_ = selected;
  }

  /**
   * Select a metrics plugin in the tree.
   *
   * @param {string} id The plugin identifier.
   */
  setSelectedPlugin(id) {
    var plugin = this.settingsModels_[id];
    if (plugin) {
      var label = plugin.getLabel();
      var node = this.root_.find('label', label);
      if (node) {
        this.selected_ = node;

        var event = new MetricsManagerEvent(MetricsManagerEventType.METRIC_CHANGE, plugin);
        this.dispatchEvent(event);
      }
    }
  }

  /**
   * Select the first leaf node in the tree.
   *
   * @return {?ITreeNode}
   */
  initSelection() {
    this.setSelected(this.root_);
    return this.root_;
  }

  /**
   * Export metrics to a json file
   */
  exportSettings() {

  }

  /**
   * Import metrics
   */
  importSettings() {

  }

  /**
   * Add a metrics plugin to the tree.
   *
   * @param {!MetricsPlugin} plugin
   * @private
   */
  addPluginToTree_(plugin) {
    try {
      var leaf = plugin.getLeafNode();
      this.root_.addChild(leaf);

      var children = this.root_.getChildren();
      children.sort(TreeSearch.labelCompare);
    } catch (e) {
      // problem?
    }
  }

  /**
   * Add a metrics plugin to the tree.
   *
   * @param {!string} label
   * @param {!string} description
   */
  setApplicationNode(label, description) {
    if (!this.root_) {
      this.root_ = new MetricNode();
      this.root_.collapsed = false;
      this.topNode_.addChild(this.root_);
    }

    this.root_.setLabel(label);
    this.root_.setDescription(description);
  }

  /**
   * Get the global instance.
   * @return {!MetricsManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new MetricsManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {MetricsManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {MetricsManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.metrics.MetricsManager');

exports = MetricsManager;
