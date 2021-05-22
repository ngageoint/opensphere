goog.module('plugin.file.kml.KMLProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * KML file provider
 */
class KMLProvider extends FileProvider {
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
    this.setId('kml');
    this.setLabel('KML Files');
  }

  /**
   * Get the global instance.
   * @return {!KMLProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new KMLProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {KMLProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {KMLProvider|undefined}
 */
let instance;

exports = KMLProvider;
