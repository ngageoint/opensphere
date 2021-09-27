goog.declareModuleId('os.ui.config.SettingsManager');

import SlickTreeNode from '../slick/slicktreenode.js';
import SettingNode from './settingnode.js';
import SettingPlugin from './settingplugin.js';
import SettingsManagerEvent from './settingsmanagerevent.js';
import SettingsManagerEventType from './settingsmanagereventtype.js';

const {defaultCompare} = goog.require('goog.array');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const Logger = goog.requireType('goog.log.Logger');

const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * Base settings manager. Applications should extend this to fill in the abstract methods.
 */
export default class SettingsManager extends EventTarget {
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
     * @type {!Object<string, !SettingPlugin>}
     * @private
     */
    this.settingsModels_ = {};

    /**
     * @type {?ITreeNode}
     * @private
     */
    this.selected_ = null;

    /**
     * A temporary root to hold the nodes as they are being built.
     * @type {?SlickTreeNode}
     * @private
     */
    this.root_ = new SlickTreeNode();
  }

  /**
   * Add a setting control to the system.
   *
   * @param {!SettingPlugin} plugin
   */
  addSettingPlugin(plugin) {
    var id = plugin.getId();
    if (!(id in this.settingsModels_)) {
      this.settingsModels_[id] = plugin;
      this.addPluginToTree_(plugin);

      var event = new SettingsManagerEvent(SettingsManagerEventType.SETTING_ADDED, plugin);
      this.dispatchEvent(event);
    } else {
      // This is a settings override for an existing plugin
      this.settingsModels_[id] = plugin;
    }
  }

  /**
   * Get the settings tree.
   *
   * @return {!Array<!ITreeNode>}
   */
  getChildren() {
    var children = this.root_.getChildren();
    if (children) {
      var sortedChildren = children.slice();
      sortedChildren.sort(function(a, b) {
        return defaultCompare(a.getLabel(), b.getLabel());
      });
      return sortedChildren;
    }

    return [];
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
   * Select a settings plugin in the tree.
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

        var event = new SettingsManagerEvent(SettingsManagerEventType.SELECTED_CHANGE, plugin);
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
    var first = null;
    var children = this.getChildren();
    while (children && children.length > 0) {
      first = children[0];
      children = first.getChildren();
    }

    this.setSelected(first);
    return first;
  }

  /**
   * Export settings to a json file
   */
  exportSettings() {

  }

  /**
   * Import settings
   */
  importSettings() {

  }

  /**
   * Add a settings plugin to the tree.
   *
   * @param {!SettingPlugin} plugin
   * @private
   */
  addPluginToTree_(plugin) {
    try {
      var leaf = plugin.getLeafNode();
      if (!this.root_.find('label', leaf.getLabel())) {
        var lastNode = this.root_;

        // create the folder structure for the plugin
        var categories = plugin.getCategories();
        for (var i = 0, n = categories.length; i < n; i++) {
          var label = categories[i];
          var existingNode = this.root_.find('label', label);
          if (!existingNode) {
            var newNode = new SettingNode();
            var defaultModel = new SettingPlugin();
            defaultModel.setIcon('fa fa-folder');
            defaultModel.setLabel(label);
            newNode.setModel(defaultModel);
            newNode.collapsed = false;
            lastNode.addChild(newNode);
            existingNode = newNode;
          }

          lastNode = existingNode;
        }

        // add the plugin to the tree
        lastNode.addChild(leaf);
      }
    } catch (e) {
      // problem?
    }
  }

  /**
   * Get the global instance.
   * @return {!SettingsManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new SettingsManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SettingsManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SettingsManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.config.SettingsManager');
