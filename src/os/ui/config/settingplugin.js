goog.provide('os.ui.config.SettingPlugin');
goog.require('goog.Disposable');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('os.config.Settings');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.config.SettingNode');



/**
 * Base class for adding a settings node to the application. Extending classes should at minimum set a new label and
 * the UI. Register the plugin using:
 *
 * <pre>
 *   os.ui.config.SettingsManager.getInstance().addSettingPlugin(new my.settings.Plugin());
 * </pre>
 *
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.config.SettingPlugin = function() {
  /**
   * The leaf node for this plugin in the settings tree.
   * @type {?os.ui.config.SettingNode}
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
   * An array of parent node labels in the settings tree.
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
   * Tags used for searching settings.
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
   * The settings UI.
   * @type {?string}
   * @protected
   */
  this.ui = null;
};
goog.inherits(os.ui.config.SettingPlugin, goog.Disposable);


/**
 * The default icon for settings nodes.
 * @type {string}
 * @const
 */
os.ui.config.SettingPlugin.DEFAULT_ICON = '<i class="fa fa-gear"></i>';


/**
 * @inheritDoc
 */
os.ui.config.SettingPlugin.prototype.disposeInternal = function() {
  os.ui.config.SettingPlugin.base(this, 'disposeInternal');

  goog.dispose(this.treeLeaf);
  this.treeLeaf = null;
};


/**
 * Get the plugin identifier used by the settings manager. The default behavior is intended to prevent adding settings
 * nodes with a duplicate tree path.
 * @return {string}
 */
os.ui.config.SettingPlugin.prototype.getId = function() {
  var id = (this.categories.length > 0 ? (this.categories.join('.') + '.') : '') + this.label;
  return id.replace(' ', '_').toLowerCase();
};


/**
 * Get the tree node for this model.
 * @return {!os.ui.config.SettingNode}
 */
os.ui.config.SettingPlugin.prototype.getLeafNode = function() {
  if (!this.treeLeaf) {
    this.treeLeaf = new os.ui.config.SettingNode();
    this.treeLeaf.setModel(this);
    this.treeLeaf.collapsed = false;
  }

  return this.treeLeaf;
};


/**
 * Get the categories for the node. Categories define the parent node names in the settings tree.
 * @return {!Array<string>}
 */
os.ui.config.SettingPlugin.prototype.getCategories = function() {
  return this.categories;
};


/**
 * Set the categories for the node.
 * @param {!Array<string>} categories
 */
os.ui.config.SettingPlugin.prototype.setCategories = function(categories) {
  this.categories = categories;
};


/**
 * Get the description for this model;
 * @return {string}
 */
os.ui.config.SettingPlugin.prototype.getDescription = function() {
  return this.description;
};


/**
 * Set a basic description for the setting, will be use as a tool tip and possible as a search string.
 * @param {string} description
 */
os.ui.config.SettingPlugin.prototype.setDescription = function(description) {
  this.description = description;
};


/**
 *
 * @return {string}
 */
os.ui.config.SettingPlugin.prototype.getIcon = function() {
  return this.icon || os.ui.config.SettingPlugin.DEFAULT_ICON;
};


/**
 *
 * @param {string} iconData
 * @param {boolean=} opt_isHtml The icon is full html else the icon is style classes.
 */
os.ui.config.SettingPlugin.prototype.setIcon = function(iconData, opt_isHtml) {
  if (opt_isHtml) {
    this.icon = iconData;
  } else {
    this.icon = goog.string.buildString('<i class="', iconData, '"></i> ');
  }
};


/**
 * Get the user-facing label to be used in the settings tree.
 * @return {string}
 */
os.ui.config.SettingPlugin.prototype.getLabel = function() {
  return this.label;
};


/**
 * Set the user-facing label to be used in the settings tree.
 * @param {string} label
 */
os.ui.config.SettingPlugin.prototype.setLabel = function(label) {
  this.label = label;
};


/**
 * Return the set of tags for search
 * @return {!Array<string>}
 */
os.ui.config.SettingPlugin.prototype.getTags = function() {
  return this.tags;
};


/**
 * Set the search tags so that this setting can be singled out using search-- not used at this time
 * @param {!Array<string>} tags
 */
os.ui.config.SettingPlugin.prototype.setTags = function(tags) {
  this.tags = tags;
};


/**
 * Get the html to be used for the ui for this setting.
 * @return {?string}
 */
os.ui.config.SettingPlugin.prototype.getUI = function() {
  return this.ui;
};


/**
 * Set the ui for the left side of the settings window.
 * This the user control ui.
 * @param {string} ui
 */
os.ui.config.SettingPlugin.prototype.setUI = function(ui) {
  this.ui = ui;
};
