goog.module('plugin.file.shp.SHPProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * SHP file provider
 */
class SHPProvider extends FileProvider {
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
    this.setId('shp');
    this.setLabel('SHP Files');
  }

  /**
   * Get the global instance.
   * @return {!SHPProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new SHPProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SHPProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SHPProvider|undefined}
 */
let instance;

exports = SHPProvider;
