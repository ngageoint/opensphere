goog.provide('plugin.file.kml.KMLLayer');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.layer.ICustomLayerVisible');
goog.require('os.layer.Vector');
goog.require('os.structs.ITreeNodeSupplier');
goog.require('plugin.file.kml.ui.KMLLayerNode');



/**
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @extends {os.layer.Vector}
 * @implements {os.structs.ITreeNodeSupplier}
 * @implements {os.layer.ICustomLayerVisible}
 * @constructor
 */
plugin.file.kml.KMLLayer = function(options) {
  plugin.file.kml.KMLLayer.base(this, 'constructor', options);

  /**
   * If the tree node should be created in the collapsed state.
   * @type {boolean}
   */
  this.collapsed = false;

  /**
   * If the KML can be edited.
   * @type {boolean}
   */
  this.editable = false;

  /**
   * If the KML root node should be displayed, or just its children.
   * @type {boolean}
   */
  this.showRoot = true;
};
goog.inherits(plugin.file.kml.KMLLayer, os.layer.Vector);
os.implements(plugin.file.kml.KMLLayer, os.layer.ICustomLayerVisible.ID);


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.disposeInternal = function() {
  // clear potential KMZ assets stored by the parser
  var source = /** @type {plugin.file.kml.KMLSource} */ (this.getSource());
  if (source) {
    var importer = source.getImporter();
    if (importer) {
      var parser = /** @type {plugin.file.kml.KMLParser} */ (importer.getParser());
      if (parser) {
        parser.clearAssets();
      }
    }
  }

  plugin.file.kml.KMLLayer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.getTreeNode = function() {
  var node = new plugin.file.kml.ui.KMLLayerNode(this);
  node.collapsed = this.collapsed;

  return node;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.setLayerVisible = function(value) {
  // You don't want to do this. For seriously. Horrible, obscenity-inducing race conditions will ensue.
  //
  // What this means in practice is that KML layers are always visible. This is fine since the tree can
  // control the visibility of all the features from the layer node.
  //
  // Use plugin.file.kml.KMLLayer.prototype.setCustomLayerVisible instead.
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.getLayerVisible = function() {
  var source = /** @type {plugin.file.kml.KMLSource} */ (this.getSource());
  var root = source.getRootNode();

  if (root) {
    return root.getState() === os.structs.TriState.ON;
  }

  return plugin.file.kml.KMLLayer.base(this, 'getLayerVisible');
};


/**
 * A custom method to control the visibility of the KML layers via
 * the node because using plugin.file.kml.KMLLayer.prototype.setLayerVisible
 * causes race conditions
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.setCustomLayerVisible = function(value) {
  var source = /** @type {plugin.file.kml.KMLSource} */ (this.getSource());
  var root = source.getRootNode();

  if (root) {
    root.setState(value ? os.structs.TriState.ON : os.structs.TriState.OFF);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.getCustomLayerVisible = function() {
  return plugin.file.kml.KMLLayer.prototype.getLayerVisible();
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.persist = function(opt_to) {
  var config = plugin.file.kml.KMLLayer.base(this, 'persist', opt_to);

  config['collapsed'] = this.collapsed;
  config['editable'] = this.editable;
  config['showRoot'] = this.showRoot;
  return config;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayer.prototype.restore = function(config) {
  plugin.file.kml.KMLLayer.base(this, 'restore', config);

  if (config['collapsed'] != null) {
    this.collapsed = config['collapsed'];
  }

  if (config['editable'] != null) {
    this.editable = config['editable'];
  }

  if (config['showRoot'] != null) {
    this.showRoot = config['showRoot'];
  }
};
