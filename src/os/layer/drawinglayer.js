goog.declareModuleId('os.layer.Drawing');

import Feature from 'ol/src/Feature.js';

import '../mixin/layerbasemixin.js';
import EventType from '../action/eventtype.js';
import DrawingLayerNode from '../data/drawinglayernode.js';
import * as dispatcher from '../dispatcher.js';
import instanceOf from '../instanceof.js';
import LayerId from './layerid.js';
import VectorLayer from './vector.js';

const {default: ITreeNodeSupplier} = goog.requireType('os.structs.ITreeNodeSupplier');
const {default: ActionEvent} = goog.requireType('os.ui.action.ActionEvent');


/**
 * @implements {ITreeNodeSupplier}
 */
export default class Drawing extends VectorLayer {
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
