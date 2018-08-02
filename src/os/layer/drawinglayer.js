goog.provide('os.layer.Drawing');

goog.require('os.data.AreaNode');
goog.require('os.data.DrawingLayerNode');
goog.require('os.layer.ILayer');
goog.require('os.layer.Vector');
goog.require('os.structs.ITreeNodeSupplier');



/**
 * @extends {os.layer.Vector}
 * @implements {os.structs.ITreeNodeSupplier}
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @constructor
 */
os.layer.Drawing = function(options) {
  os.layer.Drawing.base(this, 'constructor', options);
  os.dispatcher.listen(os.action.EventType.REMOVE_FEATURE, this.onRemoveFeature_, false, this);
};
goog.inherits(os.layer.Drawing, os.layer.Vector);


/**
 * @type {string}
 * @const
 */
os.layer.Drawing.ID = 'draw';


/**
 * @inheritDoc
 */
os.layer.Drawing.prototype.getTreeNode = function() {
  var node = new os.data.DrawingLayerNode();
  node.collapsed = true;
  node.setLayer(this);
  return node;
};


/**
 * @inheritDoc
 */
os.layer.Drawing.prototype.getId = function() {
  return os.layer.Drawing.ID;
};


/**
 * @param {os.ui.action.ActionEvent} evt The event
 * @private
 */
os.layer.Drawing.prototype.onRemoveFeature_ = function(evt) {
  var context = evt.getContext();
  if (os.instanceOf(context.feature, ol.Feature.NAME)) {
    var feature = /** {!ol.Feature} */ (context.feature);
    var source = this.getSource();
    if (source && source.getFeatureById(feature.getId()) === feature) {
      source.removeFeature(feature);
    }
  }
};
