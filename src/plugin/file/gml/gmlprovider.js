goog.module('plugin.file.gml.GMLProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GML file provider
 */
class GMLProvider extends FileProvider {
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
    this.setId('gml');
    this.setLabel('GML Files');
  }

  /**
   * Get the global instance.
   * @return {!GMLProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new GMLProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {GMLProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {GMLProvider|undefined}
 */
let instance;

exports = GMLProvider;
