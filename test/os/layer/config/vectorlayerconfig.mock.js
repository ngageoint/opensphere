goog.declareModuleId('os.layer.config.MockVectorLayerConfig');

import AbstractLayerConfig from '../../../../src/os/layer/config/abstractdatasourcelayerconfig';
import VectorLayer from '../../../../src/os/layer/vector';
import VectorSource from '../../../../src/os/source/vectorsource';


/**
 */
export default class MockVectorLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @param {Object} options The layer options.
   * @return {VectorLayer}
   */
  createLayer(options) {
    var layer = new VectorLayer({
      source: new VectorSource()
    });

    if (options['id']) {
      layer.setId(options['id']);
    }

    return layer;
  }
}

/**
 * @type {string}
 * @const
 */
MockVectorLayerConfig.TYPE = 'MockVectorLayerConfig';
