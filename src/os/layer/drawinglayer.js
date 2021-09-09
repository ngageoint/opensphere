goog.module('os.layer.Drawing');

goog.require('os.mixin.layerbase');

const Feature = goog.require('ol.Feature');
const dispatcher = goog.require('os.Dispatcher');
const EventType = goog.require('os.action.EventType');
const DrawingLayerNode = goog.require('os.data.DrawingLayerNode');
const instanceOf = goog.require('os.instanceOf');
const LayerId = goog.require('os.layer.LayerId');
const VectorLayer = goog.require('os.layer.Vector');

const ITreeNodeSupplier = goog.requireType('os.structs.ITreeNodeSupplier');
const ActionEvent = goog.requireType('os.ui.action.ActionEvent');


/**
 * @implements {ITreeNodeSupplier}
 */
class Drawing extends VectorLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorOptions} options Vector layer options
   */
  constructor(options) {
    super(options);
    dispatcher.getInstance().listen(EventType.REMOVE_FEATURE, this.onRemoveFeature_, false, this);
  }

  /**
   * @inheritDoc
   */
  getTreeNode() {
    var node = new DrawingLayerNode();
    node.collapsed = true;
    node.setLayer(this);
    return node;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return Drawing.ID;
  }

  /**
   * @param {ActionEvent} evt The event
   * @private
   */
  onRemoveFeature_(evt) {
    var context = evt.getContext();
    if (instanceOf(context.feature, Feature.NAME)) {
      var feature = /** {!Feature} */ (context.feature);
      var source = this.getSource();
      if (source && source.getFeatureById(feature.getId()) === feature) {
        source.removeFeature(feature);
      }
    }
  }
}

/**
 * @type {string}
 * @const
 */
Drawing.ID = LayerId.DRAW;

exports = Drawing;
