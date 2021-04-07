goog.module('plugin.cesium.tiles.Provider');

const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const DataManager = goog.require('os.data.DataManager');
const FileProvider = goog.require('os.data.FileProvider');
const tiles = goog.require('plugin.cesium.tiles');


/**
 * The global instance.
 * @type {Provider|undefined}
 */
let instance;


/**
 * Cesium 3D tiles provider.
 */
class Provider extends FileProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setId(tiles.ID);
    this.setLabel(tiles.TYPE);

    var layers = config['layers'];
    if (layers) {
      var dm = DataManager.getInstance();
      for (var key in layers) {
        var id = this.getId() + BaseDescriptor.ID_DELIMITER + key;
        var d = dm.getDescriptor(id);

        if (!d) {
          d = dm.createDescriptor(tiles.ID);
          d.setId(id);
          dm.addDescriptor(d);
        }

        d.updateFromConfig(layers[key]);
        d.updateActiveFromTemp();
      }
    }
  }

  /**
   * Get the global instance.
   * @return {!Provider} The instance.
   */
  static getInstance() {
    if (!instance) {
      instance = new Provider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Provider|undefined} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}

exports = Provider;
