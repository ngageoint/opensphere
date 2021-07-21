goog.module('os.ui.config.SettingPlugin');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const dispose = goog.require('goog.dispose');
const {buildString} = goog.require('goog.string');
const SettingNode = goog.require('os.ui.config.SettingNode');


/**
 * Base class for adding a settings node to the application. Extending classes should at minimum set a new label and
 * the UI. Register the plugin using:
 *
 * <pre>
 *   os.ui.config.SettingsManager.getInstance().addSettingPlugin(new my.settings.Plugin());
 * </pre>
 */
class SettingPlugin extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The leaf node for this plugin in the settings tree.
     * @type {?SettingNode}
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
   * Get the plugin identifier used by the settings manager. The default behavior is intended to prevent adding settings
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
   * @return {!SettingNode}
   */
  getLeafNode() {
    if (!this.treeLeaf) {
      this.treeLeaf = new SettingNode();
      this.treeLeaf.setModel(this);
      this.treeLeaf.collapsed = false;
    }

    return this.treeLeaf;
  }

  /**
   * Get the categories for the node. Categories define the parent node names in the settings tree.
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
   * Set a basic description for the setting, will be use as a tool tip and possible as a search string.
   *
   * @param {string} description
   */
  setDescription(description) {
    this.description = description;
  }

  /**
   *
   * @return {string}
   */
  getIcon() {
    return this.icon || SettingPlugin.DEFAULT_ICON;
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
      this.icon = buildString('<i class="', iconData, '"></i> ');
    }
  }

  /**
   * Get the user-facing label to be used in the settings tree.
   *
   * @return {string}
   */
  getLabel() {
    return this.label;
  }

  /**
   * Set the user-facing label to be used in the settings tree.
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
   * Set the search tags so that this setting can be singled out using search-- not used at this time
   *
   * @param {!Array<string>} tags
   */
  setTags(tags) {
    this.tags = tags;
  }

  /**
   * Get the html to be used for the ui for this setting.
   *
   * @return {?string}
   */
  getUI() {
    return this.ui;
  }

  /**
   * Set the ui for the left side of the settings window.
   * This the user control ui.
   *
   * @param {string} ui
   */
  setUI(ui) {
    this.ui = ui;
  }
}


/**
 * The default icon for settings nodes.
 * @type {string}
 * @const
 */
SettingPlugin.DEFAULT_ICON = '<i class="fa fa-gear"></i>';


exports = SettingPlugin;
