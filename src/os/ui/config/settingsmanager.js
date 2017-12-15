goog.provide('os.ui.config.SettingsManager');
goog.require('goog.async.Deferred');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.ui.config.SettingNode');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.config.SettingsManagerEvent');
goog.require('os.ui.config.SettingsManagerEventType');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.window');



/**
 * Base settings manager. Applications should extend this to fill in the abstract methods.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.config.SettingsManager = function() {
  os.ui.config.SettingsManager.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.config.SettingsManager.LOGGER_;

  /**
   * @type {!Object<string, !os.ui.config.SettingPlugin>}
   * @private
   */
  this.settingsModels_ = {};

  /**
   * @type {?os.structs.ITreeNode}
   * @private
   */
  this.selected_ = null;

  /**
   * A temporary root to hold the nodes as they are being built.
   * @type {?os.ui.slick.SlickTreeNode}
   * @private
   */
  this.root_ = new os.ui.slick.SlickTreeNode();
};
goog.inherits(os.ui.config.SettingsManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.config.SettingsManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.config.SettingsManager.LOGGER_ = goog.log.getLogger('os.ui.config.SettingsManager');


/**
 * Add a setting control to the system.
 * @param {!os.ui.config.SettingPlugin} plugin
 */
os.ui.config.SettingsManager.prototype.addSettingPlugin = function(plugin) {
  var id = plugin.getId();
  if (!(id in this.settingsModels_)) {
    this.settingsModels_[id] = plugin;
    this.addPluginToTree_(plugin);

    var event = new os.ui.config.SettingsManagerEvent(os.ui.config.SettingsManagerEventType.SETTING_ADDED, plugin);
    this.dispatchEvent(event);
  }
};


/**
 * Get the settings tree.
 * @return {!Array<!os.structs.ITreeNode>}
 */
os.ui.config.SettingsManager.prototype.getChildren = function() {
  var children = this.root_.getChildren();
  if (children) {
    var sortedChildren = children.slice();
    goog.array.sort(sortedChildren, function(a, b) {
      return goog.array.defaultCompare(a.getLabel(), b.getLabel());
    });
    return sortedChildren;
  }

  return [];
};


/**
 * Get the currently selected item.
 * @return {?os.structs.ITreeNode}
 */
os.ui.config.SettingsManager.prototype.getSelected = function() {
  return this.selected_;
};


/**
 * Store the last selected item
 * @param {os.structs.ITreeNode} selected
 */
os.ui.config.SettingsManager.prototype.setSelected = function(selected) {
  this.selected_ = selected;
};


/**
 * Select a settings plugin in the tree.
 * @param {string} id The plugin identifier.
 */
os.ui.config.SettingsManager.prototype.setSelectedPlugin = function(id) {
  var plugin = this.settingsModels_[id];
  if (plugin) {
    var label = plugin.getLabel();
    var node = this.root_.find('label', label);
    if (node) {
      this.selected_ = node;

      var event = new os.ui.config.SettingsManagerEvent(os.ui.config.SettingsManagerEventType.SELECTED_CHANGE,
          plugin);
      this.dispatchEvent(event);
    }
  }
};


/**
 * Select the first leaf node in the tree.
 * @return {?os.structs.ITreeNode}
 */
os.ui.config.SettingsManager.prototype.initSelection = function() {
  var first = null;
  var children = this.getChildren();
  while (children && children.length > 0) {
    first = children[0];
    children = first.getChildren();
  }

  this.setSelected(first);
  return first;
};


/**
 * Export settings to a json file
 */
os.ui.config.SettingsManager.prototype.exportSettings = function() {

};


/**
 * Import settings
 */
os.ui.config.SettingsManager.prototype.importSettings = function() {

};


/**
 * Add a settings plugin to the tree.
 * @param {!os.ui.config.SettingPlugin} plugin
 * @private
 */
os.ui.config.SettingsManager.prototype.addPluginToTree_ = function(plugin) {
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
          var newNode = new os.ui.config.SettingNode();
          var defaultModel = new os.ui.config.SettingPlugin();
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
};
