goog.module('os.layer.config.MockVectorLayerConfig');

const VectorLayer = goog.require('os.layer.Vector');
const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');
const VectorSource = goog.require('os.source.Vector');


/**
 */
class MockVectorLayerConfig extends AbstractLayerConfig {
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

exports = MockVectorLayerConfig;
