goog.declareModuleId('plugin.file.kml.KMLLayer');

import VectorLayer from '../../../os/layer/vector.js';
import KMLLayerNode from './ui/kmllayernode.js';


/**
 * @implements {ITreeNodeSupplier}
 */
export default class KMLLayer extends VectorLayer {
  /**
   * Constructor.
   * @param {olx.layer.VectorOptions} options Vector layer options
   */
  constructor(options) {
    super(options);

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
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

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getTreeNode() {
    var node = new KMLLayerNode(this);
    node.collapsed = this.collapsed;

    return node;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var config = super.persist(opt_to);

    config['collapsed'] = this.collapsed;
    config['editable'] = this.editable;
    config['showRoot'] = this.showRoot;
    return config;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    if (config['collapsed'] != null) {
      this.collapsed = config['collapsed'];
    }

    if (config['editable'] != null) {
      this.editable = config['editable'];
    }

    if (config['showRoot'] != null) {
      this.showRoot = config['showRoot'];
    }
  }
}
