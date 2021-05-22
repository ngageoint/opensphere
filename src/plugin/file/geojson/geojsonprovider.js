goog.module('plugin.file.geojson.GeoJSONProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GeoJSON file provider
 */
class GeoJSONProvider extends FileProvider {
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
    this.setId('geojson');
    this.setLabel('GeoJSON Files');
  }

  /**
   * Get the global instance.
   * @return {!GeoJSONProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new GeoJSONProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {GeoJSONProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {GeoJSONProvider|undefined}
 */
let instance;

exports = GeoJSONProvider;
