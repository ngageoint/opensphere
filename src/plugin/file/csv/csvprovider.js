goog.module('plugin.file.csv.CSVProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * CSV file provider
 */
class CSVProvider extends FileProvider {
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
    this.setId('csv');
    this.setLabel('CSV Files');
  }

  /**
   * Get the global instance.
   * @return {!CSVProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new CSVProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {CSVProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {CSVProvider|undefined}
 */
let instance;

exports = CSVProvider;
