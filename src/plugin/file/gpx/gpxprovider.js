goog.module('plugin.file.gpx.GPXProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GPX file provider
 */
class GPXProvider extends FileProvider {
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
    this.setId('gpx');
    this.setLabel('GPX Files');
  }

  /**
   * Get the global instance.
   * @return {!GPXProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new GPXProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {GPXProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {GPXProvider|undefined}
 */
let instance;

exports = GPXProvider;
